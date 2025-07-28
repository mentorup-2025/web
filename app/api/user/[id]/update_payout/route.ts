import { respOk, respErr } from '@/lib/resp';
import { updateAliPay, updateWechatPay } from '@/lib/payout_info';
import { UpdatePayoutInfoInput } from '@/types/payout_info';
import { auth } from '@clerk/nextjs/server';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {


        const userId = params.id;

        if (!userId) {
            return respErr('Missing user ID');
        }

        // Get user from Clerk session
        const { userId: sessionUserId } = await auth();

        if (!sessionUserId) {
            return respErr('Unauthorized: User not authenticated');
        }

        // Validate that the authenticated user ID matches the user ID in the URL params
        if (sessionUserId !== userId) {
            return respErr('Unauthorized: unthorized user attempting to update resources for another user');
        }

        // Get update data from request
        const updateInput = await request.json() as UpdatePayoutInfoInput;
        console.log('Received payout update data for user:', userId);

        // Validate update input
        if (!updateInput.alipayInfo && !updateInput.wechatPayInfo) {
            return respErr('No payout information provided');
        }

        // Update AliPay information if provided
        if (updateInput.alipayInfo) {
            try {
                console.log('Updating AliPay info for user:', userId);
                await updateAliPay(userId, updateInput.alipayInfo);
                console.log('AliPay info updated successfully');
            } catch (alipayError) {
                console.error('Error updating AliPay info:', alipayError);
                return respErr(`Failed to update AliPay info: ${alipayError instanceof Error ? alipayError.message : 'Unknown error'}`);
            }
        }

        // Update WeChat Pay information if provided
        if (updateInput.wechatPayInfo) {
            try {
                console.log('Updating WeChat Pay info for user:', userId);
                await updateWechatPay(userId, updateInput.wechatPayInfo.wechatId);
                console.log('WeChat Pay info updated successfully');
            } catch (wechatError) {
                console.error('Error updating WeChat Pay info:', wechatError);
                return respErr(`Failed to update WeChat Pay info: ${wechatError instanceof Error ? wechatError.message : 'Unknown error'}`);
            }
        }

        console.log(`Payout information updated for user ${userId}`);
        return respOk();

    } catch (error) {
        console.error('Error in payout update route:', error);

        if (error instanceof Error) {
            return respErr(`Failed to update payout information: ${error.message}`);
        }

        return respErr('Failed to update payout information: Unknown error');
    }
} 