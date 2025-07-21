import { respJson, respErr, respData } from '@/lib/resp';
import { getUserAppointment } from '@/lib/appointment';
import { isFreeCoffeeChat } from '../../../../services/constants';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Get all appointments for the user
        const appointments = await getUserAppointment(params.id);
        console.log('📊 Total appointments for user:', appointments.length);

        // Filter appointments based on criteria:
        // 1. Exclude appointments with status 'canceled' or 'pending'
        // 2. Exclude appointments where the user is the mentor (only include where user is mentee)
        // 3. Only include appointments with service_type "Free coffee chat (15 mins)"
        const coffeeChatAppointments = appointments.filter(appointment => {
            // Exclude canceled or pending appointments
            if (appointment.status === 'canceled' || appointment.status === 'pending') {
                console.log('❌ Excluded - Status:', appointment.status);
                return false;
            }

            // Exclude appointments where user is mentor (only include where user is mentee)
            if (appointment.mentor_id === params.id) {
                return false;
            }

            // Only include "Free coffee chat (15 mins)" appointments
            if (isFreeCoffeeChat(appointment.service_type)) {
                console.log('❌ Excluded - Service type:', appointment.service_type);
                return false;
            }

            return true;
        });

        // Return the count of filtered appointments
        const coffeeChatCount = coffeeChatAppointments.length;
        console.log('🎯 Final coffee chat count:', coffeeChatCount);

        return respJson(0, 'ok', coffeeChatCount);

    } catch (error) {
        console.error('Error in get coffee chat time:', error);
        return respErr('Failed to get coffee chat count');
    }
}
