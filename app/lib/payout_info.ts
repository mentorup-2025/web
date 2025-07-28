import { getSupabaseClient } from '../services/supabase';
import { AliPayInfo } from '../types/payout_info';

/**
 * Update AliPay information for a user
 * @param userId - The user ID
 * @param aliPayInfo - AliPay account information (name and phone)
 * @returns Promise with success status and any error
 */
export async function updateAliPay(userId: string, aliPayInfo: AliPayInfo) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('payout_info')
      .upsert({
        id: userId,
        ali_pay: aliPayInfo,
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Error updating AliPay info:', error);
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to update AliPay info:', error);
    throw error;
  }
}

/**
 * Update WeChat Pay information for a user
 * @param userId - The user ID
 * @param wechatId - WeChat ID string
 * @returns Promise with success status and any error
 */
export async function updateWechatPay(userId: string, wechatId: string) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('payout_info')
      .upsert({
        id: userId,
        wechat_pay: wechatId,
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Error updating WeChat Pay info:', error);
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to update WeChat Pay info:', error);
    throw error;
  }
}
