-- Update cancel_booking function to accept cancel_reason parameter
CREATE OR REPLACE FUNCTION cancel_booking(
  hold_id UUID,
  appointment_id UUID,
  cancel_reason TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  canceled_appointment appointments;
  current_utc TIMESTAMPTZ := NOW() AT TIME ZONEUTC
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
    cancel_reason = cancel_booking.cancel_reason,
    updated_at = current_utc
  WHERE id = cancel_booking.appointment_id
    AND status IN (pending_payment,confirmed) -- 只允许取消待支付或已确认的预约
  RETURNING * INTO canceled_appointment;

  -- 验证更新结果
  IF canceled_appointment IS NULL THEN
    RAISE EXCEPTION CANCELLATION_FAILED: Invalid appointment state';
  END IF;

  RETURN jsonb_build_object(
   appointment_id', appointment_id,
   status,canceled',
canceled_at', current_utc,
  cancel_reason', cancel_booking.cancel_reason,
    'time_slot', canceled_appointment.time_slot
  );

EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      error', SQLERRM,
    sql_state, SQLSTATE,utc_time, current_utc
    );
END;
$$;

-- Add comment to the updated function
COMMENT ON FUNCTION cancel_booking(UUID, UUID, TEXT) IS 'Cancels an appointment with optional cancel reason'; 