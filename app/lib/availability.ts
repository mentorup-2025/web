import { supabase } from '@/app/supabase/client';
import { Availability, SetAvailabilityRequest } from '@/app/types/availability';
import { startOfWeek, addDays, parse, format } from 'date-fns';

// 将时间槽转换为可用性数据
export const convertSlotsToAvailability = (
  userId: string,
  slots: Array<{ start: Date; end: Date }>
): Omit<Availability, 'id' | 'created_at' | 'updated_at'>[] => {
  return slots.map(slot => {
    const dayOfWeek = slot.start.getDay();
    return {
      user_id: userId,
      day_of_week: dayOfWeek,
      start_time: format(slot.start, 'HH:mm'),
      end_time: format(slot.end, 'HH:mm')
    };
  });
};

// 将可用性数据转换为日历事件
export const convertAvailabilityToEvents = (
  availabilities: Availability[]
): Array<{ start: Date; end: Date; title: string }> => {
  const currentWeekStart = startOfWeek(new Date());
  
  return availabilities.flatMap(availability => {
    const dayDate = addDays(currentWeekStart, availability.day_of_week);
    
    const start = parse(
      `${format(dayDate, 'yyyy-MM-dd')} ${availability.start_time}`,
      'yyyy-MM-dd HH:mm',
      new Date()
    );
    
    const end = parse(
      `${format(dayDate, 'yyyy-MM-dd')} ${availability.end_time}`,
      'yyyy-MM-dd HH:mm',
      new Date()
    );

    return {
      start,
      end,
      title: 'Available'
    };
  });
};

// 获取导师可用时间
export const getMentorAvailability = async (userId: string) => {
  const { data, error } = await supabase
    .from('mentor_availability')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw new Error('Failed to fetch mentor availability');
  }

  return data as Availability[];
};

// 设置导师可用时间
export const setMentorAvailability = async (
  request: SetAvailabilityRequest
) => {
  const { user_id, availabilities } = request;

  // 首先删除现有的可用时间
  const { error: deleteError } = await supabase
    .from('mentor_availability')
    .delete()
    .eq('user_id', user_id);

  if (deleteError) {
    throw new Error('Failed to delete existing availability');
  }

  // 插入新的可用时间
  const { data, error } = await supabase
    .from('mentor_availability')
    .insert(
      availabilities.map(availability => ({
        user_id,
        ...availability
      }))
    )
    .select();

  if (error) {
    throw new Error('Failed to set availability');
  }

  return data as Availability[];
};

// 更新特定的可用时间
export const updateAvailability = async (
  id: string,
  availability: Partial<Availability>
) => {
  const { data, error } = await supabase
    .from('mentor_availability')
    .update(availability)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to update availability');
  }

  return data as Availability;
};

// 删除特定的可用时间
export const deleteAvailability = async (id: string) => {
  const { error } = await supabase
    .from('mentor_availability')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Failed to delete availability');
  }
};

// 检查时间段是否有效
export const isValidTimeSlot = (
  start: Date,
  end: Date,
  existingSlots: Array<{ start: Date; end: Date }>
) => {
  // 检查时间是否在工作时间内 (9:00 AM - 5:00 PM)
  const startHour = start.getHours();
  const endHour = end.getHours();
  if (startHour < 9 || endHour > 17) {
    return false;
  }

  // 检查是否与现有时间段重叠
  return !existingSlots.some(slot => {
    return (
      (start >= slot.start && start < slot.end) ||
      (end > slot.start && end <= slot.end) ||
      (start <= slot.start && end >= slot.end)
    );
  });
}; 