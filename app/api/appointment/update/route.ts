import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { respData, respErr } from '@/lib/resp';
import { getAppointment, updateAppointment } from '@/lib/appointment';
import { sendEmail } from '@/lib/email';
import { EmailTemplate } from '@/types/email';
import { getUser } from '@/lib/user';
import { UpdateAppointmentInput } from '@/types/appointment';
import { convertUTCToPDT } from '@/lib/utc_to_pdt';

export async function POST(request: Request) {
    try {
        const input: UpdateAppointmentInput = await request.json();

        // Validate required fields
        if (!input.appointment_id) {
            return respErr('Missing appointment ID');
        }

        // Validate that at least one update field is provided
        if (!input.status && !input.link  && !input.extra_info && !input.description && !input.cancel_reason) {
            return respErr('No update fields provided');
        }

        // Validate status if provided
        if (input.status && !['confirmed', 'completed', 'canceled', 'noshow'].includes(input.status)) {
            return respErr('Invalid status value');
        }

        // Validate link if provided
        if (input.link && typeof input.link !== 'string') {
            return respErr('Link must be a string');
        }


        // Validate extra_info if provided
        if (input.extra_info && typeof input.extra_info !== 'string') {
            return respErr('Extra info must be a string');
        }

        // Validate description if provided
        if (input.description && typeof input.description !== 'string') {
            return respErr('Description must be a string');
        }

        // Validate cancel_reason if provided
        if (input.cancel_reason && typeof input.cancel_reason !== 'string') {
            return respErr('Cancel reason must be a string');
        }

        // Validate that if cancel_reason is provided, status must be canceled'
        if (input.cancel_reason && (!input.status || input.status !== 'canceled')) {
            return respErr('Cancel reason can only be provided when status is set to canceled');
        }

        // Check if appointment exists and is confirmed
        const appointment = await getAppointment(input.appointment_id);

        if (!appointment) {
            return respErr('Appointment not found');
        }

        if (appointment.status == 'pending') {
            return respErr('pending appointment cannot be updated');
        }

        // Update appointment
        await updateAppointment(input.appointment_id, {
            status: input.status,
            link: input.link,
            extra_info: input.extra_info,
            description: input.description,
            cancel_reason: input.cancel_reason
        });

        // 6. 如果取消，则发邮件
        if (input.status === 'canceled') {
            console.log('✉️ 检测到 status=canceled，开始发邮件流程');
            // 拿 mentee
            const mentee = await getUser(appointment.mentee_id);
            const mentor = await getUser(appointment.mentor_id);
            console.log('👤 getUser 返回 mentee =', mentee);
            console.log('👤 getUser 返回 mentor =', mentor);
            // 6.1 发给 mentee
            if (mentee && mentor) {
                console.log('✉️ 给 mentee:', mentee.email);
                await sendEmail(
                    'MentorUp <contactus@mentorup.info>',
                    mentee.email,
                    EmailTemplate.SESSION_CANCELED,
                    {
                        recipientName: mentee.username,
                        mentorName: mentor.username,
                        appointmentId: input.appointment_id,
                        cancelReason: input.cancel_reason,
                        sessionDate: appointment.start_time.split('T')[0],
                        sessionTime: new Date(convertUTCToPDT(appointment.start_time)).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: 'numeric',
                          timeZoneName: 'short'
                        }) + ' PDT',
                        isMentee: true,
                    }
                );
                console.log('✅ 已发送取消邮件给 mentee');
            } else {
                console.log('⚠️ mentee 没有 email，不发给 mentee');
            }

            // 6.2 发给 support inbox
            // await sendEmail(
            //     'MentorUp <contactus@mentorup.info>',
            //     'contactus@mentorup.info',
            //     EmailTemplate.SESSION_CANCELED,
            //     {
            //         recipientName: 'MentorUp Support',
            //         appointmentId: input.appointment_id,
            //         cancelReason: input.cancel_reason,
            //         sessionDate: appointment.start_time.split('T')[0],
            //         sessionTime: new Date(convertUTCToPDT(appointment.start_time)).toLocaleTimeString('en-US', {
            //           hour: 'numeric',
            //           minute: 'numeric',
            //           timeZoneName: 'short'
            //         }) + ' PDT',
            //     }
            // );
            // console.log('✅ 已发送取消邮件给 support inbox');

            // 6.3 发给 mentor（复用同一个 SESSION_CANCELED 模板）
            if (mentor?.email && mentee) {
                await sendEmail(
                    'MentorUp <contactus@mentorup.info>',
                    mentor.email,
                    EmailTemplate.SESSION_CANCELED,
                    {
                        recipientName: mentor.username,      // 邮件里 “Hi {recipientName}”
                        mentorName:    mentee.username,      // 邮件里 “your session with <strong>{mentorName}</strong>” 这儿反过来填 mentee
                        appointmentId: input.appointment_id,
                        cancelReason:  input.cancel_reason!,
                        sessionDate:   appointment.start_time.split('T')[0],
                        sessionTime:   new Date(convertUTCToPDT(appointment.start_time)).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: 'numeric',
                          timeZoneName: 'short'
                        }) + ' PDT',
                        isMentee: false,
                    }
                );
                console.log('✅ 已发送取消邮件给 mentor:', mentor.email);
            } else {
                console.warn('⚠️ mentor.email 不可用，跳过给 mentor 发邮件');
            }
        }


        console.log('🎉 Appointment update flow 完成');

        return respData({ message: 'Appointment updated successfully' });

    } catch (error) {
        console.error('Error updating appointment:', error);

        if (error instanceof Error) {
            if (error.message.includes('violates exclusion constraint')) {
                return respErr('Time slot conflicts with another appointment');
            }
            return respErr(error.message);
        }

        return respErr('Failed to update appointment');
    }
}