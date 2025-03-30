CREATE OR REPLACE FUNCTION set_weekly_availability(
  mentor_id UUID,
  availability JSON[]
) 
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- 删除旧数据
  DELETE FROM mentor_availability 
  WHERE mentor_id = set_weekly_availability.mentor_id;

  -- 插入新数据
  INSERT INTO mentor_availability (mentor_id, weekday, time_range)
  SELECT 
    mentor_id,
    (a->>'weekday')::int,
    tstzrange(
      (CURRENT_DATE + (a->>'start_time')::time) AT TIME ZONE 'UTC',
      (CURRENT_DATE + (a->>'end_time')::time) AT TIME ZONE 'UTC',
      '[)'
    )
  FROM json_array_elements(set_weekly_availability.availability) a;
END;
$$;

CREATE OR REPLACE FUNCTION get_mentor_daily_availability(
  mentor_id UUID,
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
      (query_date + (lower(time_range)::time)) AT TIME ZONE 'UTC',
      (query_date + (upper(time_range)::time)) AT TIME ZONE 'UTC',
      '[)'
    ) AS slot
    FROM mentor_availability
    WHERE mentor_id = mentor_id
      AND weekday = EXTRACT(DOW FROM query_date)
      AND query_date BETWEEN valid_from AND COALESCE(valid_until, 'infinity'::date)
  ),
  
  -- 获取当天的覆盖规则
  override_slots AS (
    SELECT unnest(time_ranges) AS slot
    FROM mentor_overrides
    WHERE mentor_id = mentor_id
      AND override_date = query_date
  ),
  
  -- 合并时间槽（覆盖规则优先）
  combined_slots AS (
    SELECT slot FROM override_slots
    UNION ALL
    SELECT slot FROM regular_slots
    WHERE NOT EXISTS (
      SELECT 1 FROM mentor_overrides
      WHERE mentor_id = mentor_id
        AND override_date = query_date
    )
  )
  
  -- 排除屏蔽时间和已预约时间
  SELECT cs.slot
  FROM combined_slots cs
  WHERE NOT EXISTS (
    SELECT 1 FROM mentor_blocks
    WHERE mentor_id = mentor_id
      AND blocked_range @> cs.slot
  )
  AND NOT EXISTS (
    SELECT 1 FROM appointments
    WHERE mentor_id = mentor_id
      AND time_slot && cs.slot
      AND status <> 'canceled'
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_mentor_availability(
  mentor_id UUID,
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
        (ds.date + (lower(ma.time_range)::time) AT TIME ZONE 'UTC'),
        (ds.date + (upper(ma.time_range)::time) AT TIME ZONE 'UTC'),
        '[)'
      ) AS slot
    FROM mentor_availability ma
    JOIN date_series ds ON EXTRACT(DOW FROM ds.date) = ma.weekday
    WHERE ma.mentor_id = get_mentor_availability.mentor_id
      AND ds.date BETWEEN ma.valid_from AND COALESCE(ma.valid_until, 'infinity'::date)
  ),
  override_slots AS (
    SELECT unnest(mo.time_ranges) AS slot
    FROM mentor_overrides mo
    WHERE mo.mentor_id = get_mentor_availability.mentor_id
      AND mo.override_date BETWEEN start_date AND end_date
  ),
  combined_slots AS (
    SELECT slot FROM regular_slots
    WHERE NOT EXISTS (
      SELECT 1 FROM mentor_overrides 
      WHERE mentor_id = get_mentor_availability.mentor_id 
        AND override_date = (regular_slots.slot::date)
    )
    UNION ALL
    SELECT slot FROM override_slots
  )
  SELECT cs.slot
  FROM combined_slots cs
  WHERE NOT EXISTS (
    SELECT 1 FROM mentor_blocks mb
    WHERE mb.mentor_id = get_mentor_availability.mentor_id
      AND mb.blocked_range @> cs.slot
  )
  AND NOT EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.mentor_id = get_mentor_availability.mentor_id
      AND a.time_slot && cs.slot
      AND a.status <> 'canceled'
  );
END;
$$;

create or replace function reserve_slot (appointment_data JSONB) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER as $$
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
  
  expires_at TIMESTAMPTZ := (NOW() AT TIME ZONE 'UTC') + INTERVAL '10 minutes';
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

  DELETE FROM temp_holds WHERE mentor_id = mentor_id 
  AND time_slot && time_slot_range 
  AND expires_at <= current_utc;


  -- Insert temporary hold (UTC time)
  INSERT INTO temp_holds (mentor_id, mentee_id, time_slot, expires_at)
  VALUES (
    mentor_uuid,
    mentee_id,
    time_slot_range,
    expires_at AT TIME ZONE 'UTC'
  )
  RETURNING id INTO new_hold_id;

  -- Insert appointment record (UTC time)
  INSERT INTO appointments (mentor_id, mentee_id, time_slot, status, service_type, price, created_at, updated_at)
  VALUES (
    mentor_uuid,
    mentee_id,
    time_slot_range,
    'pending_payment',
    service_type,
    price,
    NOW() AT TIME ZONE 'UTC',  -- created_at
    NOW() AT TIME ZONE 'UTC'   -- updated_at
  )
  RETURNING id INTO new_appointment_id;

  -- Return UTC time formatted result
  RETURN jsonb_build_object(
    'hold_id', new_hold_id,
    'appointment_id', new_appointment_id,
    'expires_at', expires_at AT TIME ZONE 'UTC',
    'utc_time_slot', time_slot_range
  );

EXCEPTION
  WHEN invalid_datetime_format THEN
    RAISE EXCEPTION 'INVALID_TIME_FORMAT';
  WHEN others THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'sql_state', SQLSTATE,
      'utc_time', NOW() AT TIME ZONE 'UTC'
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