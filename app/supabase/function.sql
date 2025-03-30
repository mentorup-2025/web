CREATE OR REPLACE FUNCTION set_weekly_availability(
  p_mentor_id UUID,
  availability JSON[]
) 
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- First, delete existing time slots for the mentor
  DELETE FROM mentor_availability 
  WHERE mentor_id = p_mentor_id;

  -- Insert new time slots with separate start_time and end_time
  INSERT INTO mentor_availability (
    mentor_id,
    weekday,
    start_time,
    end_time
  )
  SELECT 
    p_mentor_id,
    (availability_slot->>'day_of_week')::integer,
    (availability_slot->>'start_time')::time,  -- Start time as time
    (availability_slot->>'end_time')::time     -- End time as time
  FROM unnest(availability) AS availability_slot
  WHERE 
    (availability_slot->>'start_time') IS NOT NULL AND
    (availability_slot->>'end_time') IS NOT NULL; -- Ensure both times are provided
END;
$$;

CREATE OR REPLACE FUNCTION get_mentor_daily_availability(
  p_mentor_id UUID,
  query_date DATE
) RETURNS TABLE (available_time tstzrange)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH 
  -- 获取当天的常规可用性
  regular_slots AS (
    SELECT tstzrange(
      (query_date + start_time) AT TIME ZONE 'UTC',
      (query_date + end_time) AT TIME ZONE 'UTC',
      '[)'
    ) AS slot
    FROM mentor_availability
    WHERE mentor_id = p_mentor_id
      AND weekday = EXTRACT(DOW FROM query_date)
  ),
  
  -- 获取当天的覆盖规则
  override_slots AS (
    SELECT unnest(time_slot) AS slot
    FROM mentor_overrides
    WHERE mentor_id = p_mentor_id
      AND override_date = query_date
  ),
  
  -- 合并时间槽（覆盖规则优先）
  combined_slots AS (
    SELECT slot FROM override_slots
    UNION ALL
    SELECT slot FROM regular_slots
    WHERE NOT EXISTS (
      SELECT 1 FROM mentor_overrides
      WHERE mentor_id = p_mentor_id
        AND override_date = query_date
    )
  ),
  
  -- 获取所有不可用时间点（开始和结束时间）
  time_points AS (
    -- 基础时间段的边界
    SELECT lower(slot) AS time_point, 'start' AS point_type
    FROM combined_slots
    UNION ALL
    SELECT upper(slot) AS time_point, 'end' AS point_type
    FROM combined_slots
    
    UNION ALL
    
    -- 预约时间的边界
    SELECT lower(time_slot) AS time_point, 'booked_start' AS point_type
    FROM appointments
    WHERE mentor_id = p_mentor_id
      AND status <> 'canceled'
      AND time_slot && tstzrange(
        query_date AT TIME ZONE 'UTC',
        (query_date + INTERVAL '1 day') AT TIME ZONE 'UTC',
        '[)'
      )
    UNION ALL
    SELECT upper(time_slot) AS time_point, 'booked_end' AS point_type
    FROM appointments
    WHERE mentor_id = p_mentor_id
      AND status <> 'canceled'
      AND time_slot && tstzrange(
        query_date AT TIME ZONE 'UTC',
        (query_date + INTERVAL '1 day') AT TIME ZONE 'UTC',
        '[)'
      )
  ),
  
  -- 排序并标记时间点
  ordered_points AS (
    SELECT 
      time_point,
      point_type,
      LAG(time_point) OVER (ORDER BY time_point) AS prev_point,
      LEAD(time_point) OVER (ORDER BY time_point) AS next_point
    FROM time_points
    ORDER BY time_point
  ),
  
  -- 生成可用时间段
  available_ranges AS (
    SELECT tstzrange(time_point, next_point, '[)') AS slot
    FROM ordered_points
    WHERE point_type IN ('booked_end', 'start')
      AND next_point IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM appointments a
        WHERE mentor_id = p_mentor_id
          AND status <> 'canceled'
          AND tstzrange(time_point, next_point, '[)') && a.time_slot
      )
  )
  
  -- 最终结果
  SELECT slot AS available_time
  FROM available_ranges
  WHERE lower(slot) < upper(slot)
  ORDER BY slot;
END;
$$;


CREATE OR REPLACE FUNCTION cancel_booking(
  hold_id UUID,
  appointment_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  canceled_appointment appointments;
  current_utc TIMESTAMPTZ := NOW() AT TIME ZONE 'UTC';
  previous_status TEXT;
BEGIN
  -- 锁定预约记录防止并发修改
  PERFORM pg_advisory_xact_lock(hashtext('appt_' || appointment_id::text));

  -- 清理关联锁定（存在则删除）
  DELETE FROM temp_holds 
  WHERE id = cancel_booking.hold_id;

  -- 获取当前状态并更新为 canceled
  UPDATE appointments 
  SET 
    status = 'canceled',
    updated_at = current_utc
  WHERE id = cancel_booking.appointment_id
    AND status IN ('pending_payment', 'confirmed') -- 只允许取消待支付或已确认的预约
  RETURNING * INTO canceled_appointment;

  -- 验证更新结果
  IF canceled_appointment IS NULL THEN
    RAISE EXCEPTION 'CANCELLATION_FAILED: Invalid appointment state';
  END IF;

  RETURN jsonb_build_object(
    'appointment_id', appointment_id,
    'status', 'canceled',
    'canceled_at', current_utc,
    'time_slot', canceled_appointment.time_slot
  );

EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'sql_state', SQLSTATE,
      'utc_time', current_utc
    );
END;
$$;


CREATE OR REPLACE FUNCTION confirm_booking(
  hold_id UUID,
  appointment_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  confirmed_appointment appointments;
  current_utc TIMESTAMPTZ := NOW() AT TIME ZONE 'UTC';
BEGIN
  -- 锁定预约记录防止并发修改
  PERFORM pg_advisory_xact_lock(hashtext('appt_' || appointment_id::text));

  -- 清理关联锁定（存在则删除）
  DELETE FROM temp_holds 
  WHERE id = confirm_booking.hold_id;

  -- 更新预约状态
  UPDATE appointments 
  SET 
    status = 'confirmed',
    updated_at = current_utc
  WHERE id = confirm_booking.appointment_id
    AND status = 'pending_payment'
  RETURNING * INTO confirmed_appointment;

  -- 验证状态更新结果
  IF confirmed_appointment IS NULL THEN
    RAISE EXCEPTION 'CONFIRMATION_FAILED: Invalid appointment state';
  END IF;

  RETURN jsonb_build_object(
    'appointment_id', appointment_id,
    'status', 'confirmed',
    'confirmed_at', current_utc,
    'time_slot', confirmed_appointment.time_slot
  );

EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'sql_state', SQLSTATE,
      'utc_time', current_utc
    );
END;
$$;

CREATE OR REPLACE FUNCTION reserve_slot (appointment_data JSONB) 
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
  new_hold_id UUID;
  new_appointment_id UUID;
  mentor_uuid UUID := (appointment_data->>'mentor_id')::UUID;
  mentee_uuid UUID := (appointment_data->>'mentee_id')::UUID;
  service_type text := (appointment_data->>'service_type')::text;
  price float := (appointment_data->>'price')::float;
  
  -- Explicitly convert to UTC time range
  time_slot_range TSTZRANGE := 
    tstzrange(
      (appointment_data->>'start_time')::timestamptz AT TIME ZONE 'UTC',
      (appointment_data->>'end_time')::timestamptz AT TIME ZONE 'UTC',
      '[)'
    );
  
  p_expires_at TIMESTAMPTZ := (NOW() AT TIME ZONE 'UTC') + INTERVAL '10 minutes';
  current_utc TIMESTAMPTZ := NOW() AT TIME ZONE 'UTC';
BEGIN
  -- Validate time range validity
  IF isempty(time_slot_range) OR upper_inf(time_slot_range) THEN
    RAISE EXCEPTION 'INVALID_TIME_RANGE';
  END IF;

  -- Advisory lock using UTC time
  PERFORM pg_advisory_xact_lock(
    hashtext('utc_lock_' || mentor_uuid::text || '_' || date_trunc('day', lower(time_slot_range))::text)
  );

  -- Conflict detection (based on UTC time)
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE mentor_id = mentor_uuid
      AND time_slot && time_slot_range
      AND status <> 'canceled'
      AND time_slot <@ tstzrange(
        (NOW() AT TIME ZONE 'UTC') - INTERVAL '1 year',
        (NOW() AT TIME ZONE 'UTC') + INTERVAL '1 year'
      )
  ) THEN
    RAISE EXCEPTION 'CONFLICT_EXISTING_APPOINTMENT';
  END IF;

  IF EXISTS (
    SELECT 1 FROM temp_holds
    WHERE mentor_id = mentor_uuid
      AND time_slot && time_slot_range
      AND expires_at > current_utc  -- Critical: Only check unexpired holds
  ) THEN
    RAISE EXCEPTION 'CONFLICT_ACTIVE_HOLD';
  END IF;

  DELETE FROM temp_holds 
  WHERE mentor_id = mentor_uuid 
  AND time_slot && time_slot_range 
  AND expires_at <= current_utc;

  -- Insert temporary hold (UTC time)
  INSERT INTO temp_holds (mentor_id, mentee_id, time_slot, expires_at)
  VALUES (
    mentor_uuid,
    mentee_uuid,
    time_slot_range,
    p_expires_at AT TIME ZONE 'UTC'
  )
  RETURNING mentor_id INTO new_hold_id;  -- Changed to return mentor_id instead of id

  -- Insert appointment record (UTC time)
  INSERT INTO appointments (mentor_id, mentee_id, time_slot, status, service_type, price, created_at, updated_at)
  VALUES (
    mentor_uuid,
    mentee_uuid,
    time_slot_range,
    'pending',
    service_type,
    price,
    NOW() AT TIME ZONE 'UTC',  -- created_at
    NOW() AT TIME ZONE 'UTC'   -- updated_at
  )
  RETURNING mentor_id INTO new_appointment_id;  -- Changed to return mentor_id instead of id

  -- Return UTC time formatted result
  RETURN jsonb_build_object(
    'hold_id', new_hold_id,
    'appointment_id', new_appointment_id,
    'expires_at', p_expires_at AT TIME ZONE 'UTC',
    'utc_time_slot', time_slot_range
  );

EXCEPTION
  WHEN invalid_datetime_format THEN
    RAISE EXCEPTION 'INVALID_TIME_FORMAT';
  WHEN others THEN
    RAISE;  -- Re-raise the exception to propagate the error
END;
$$;

CREATE OR REPLACE FUNCTION get_mentor_availability(
  p_mentor_id UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (slot_time tstzrange) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE date_series AS (
    SELECT start_date AS date
    UNION ALL
    SELECT date + 1 
    FROM date_series 
    WHERE date < end_date
  ),
  regular_slots AS (
    SELECT
      tstzrange(
        (ds.date + ma.start_time) AT TIME ZONE 'UTC',
        (ds.date + ma.end_time) AT TIME ZONE 'UTC',
        '[)'
      ) AS slot
    FROM mentor_availability ma
    JOIN date_series ds ON EXTRACT(DOW FROM ds.date) = ma.weekday
    WHERE ma.mentor_id = p_mentor_id
  ),
  override_slots AS (
    SELECT unnest(mo.time_slot) AS slot
    FROM mentor_overrides mo
    WHERE mo.mentor_id = p_mentor_id
      AND mo.override_date BETWEEN start_date AND end_date
  ),
  combined_slots AS (
    SELECT slot FROM regular_slots
    UNION ALL
    SELECT slot FROM override_slots
  ),
  
  -- 获取所有时间点
  time_points AS (
    -- 基础时间段的边界
    SELECT lower(slot) AS time_point, 'start' AS point_type, slot AS original_slot
    FROM combined_slots
    UNION ALL
    SELECT upper(slot) AS time_point, 'end' AS point_type, slot AS original_slot
    FROM combined_slots
    
    UNION ALL
    
    -- 预约时间的边界
    SELECT lower(time_slot) AS time_point, 'booked_start' AS point_type, NULL AS original_slot
    FROM appointments
    WHERE mentor_id = p_mentor_id
      AND status <> 'canceled'
      AND time_slot && tstzrange(
        start_date AT TIME ZONE 'UTC',
        (end_date + INTERVAL '1 day') AT TIME ZONE 'UTC',
        '[)'
      )
    UNION ALL
    SELECT upper(time_slot) AS time_point, 'booked_end' AS point_type, NULL AS original_slot
    FROM appointments
    WHERE mentor_id = p_mentor_id
      AND status <> 'canceled'
      AND time_slot && tstzrange(
        start_date AT TIME ZONE 'UTC',
        (end_date + INTERVAL '1 day') AT TIME ZONE 'UTC',
        '[)'
      )
    
    UNION ALL
    
    -- 屏蔽时间的边界
    SELECT lower(blocked_range) AS time_point, 'blocked_start' AS point_type, NULL AS original_slot
    FROM mentor_blocks
    WHERE mentor_id = p_mentor_id
      AND blocked_range && tstzrange(
        start_date AT TIME ZONE 'UTC',
        (end_date + INTERVAL '1 day') AT TIME ZONE 'UTC',
        '[)'
      )
    UNION ALL
    SELECT upper(blocked_range) AS time_point, 'blocked_end' AS point_type, NULL AS original_slot
    FROM mentor_blocks
    WHERE mentor_id = p_mentor_id
      AND blocked_range && tstzrange(
        start_date AT TIME ZONE 'UTC',
        (end_date + INTERVAL '1 day') AT TIME ZONE 'UTC',
        '[)'
      )
  ),
  
  -- 排序并标记时间点
  ordered_points AS (
    SELECT 
      time_point,
      point_type,
      original_slot,
      LAG(time_point) OVER (ORDER BY time_point) AS prev_point,
      LEAD(time_point) OVER (ORDER BY time_point) AS next_point
    FROM time_points
    ORDER BY time_point
  ),
  
  -- 生成可用时间段
  available_ranges AS (
    SELECT tstzrange(op.time_point, op.next_point, '[)') AS slot
    FROM ordered_points op
    WHERE op.point_type IN ('booked_end', 'blocked_end', 'start')
      AND op.next_point IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM combined_slots cs
        WHERE op.time_point >= lower(cs.slot)
          AND op.next_point <= upper(cs.slot)
      )
      AND NOT EXISTS (
        SELECT 1 FROM appointments a
        WHERE mentor_id = p_mentor_id
          AND status <> 'canceled'
          AND tstzrange(op.time_point, op.next_point, '[)') && a.time_slot
      )
      AND NOT EXISTS (
        SELECT 1 FROM mentor_blocks mb
        WHERE mentor_id = p_mentor_id
          AND tstzrange(op.time_point, op.next_point, '[)') && mb.blocked_range
      )
  )
  
  -- 最终结果
  SELECT slot AS slot_time
  FROM available_ranges
  WHERE lower(slot) < upper(slot)
  ORDER BY slot;
END;
$$;
