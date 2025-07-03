import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { CreateUserInput } from '@/types/user'
import { respData, respErr, respOk } from '@/lib/resp'
import { EmailTemplate } from '@/types/email'
import { createUser } from '@/lib/user'
import { sendEmail } from '@/lib/email'

async function saveNewUser(userId: string, email: string, username: string, image_url: string) {
  try {
    const userData: CreateUserInput = {
      user_id: userId,
      email: email,
      username: username,
      profile_url: image_url
    }

    const user = await createUser(userData)
    console.log('User created successfully:', user)

    try {
      await sendEmail('contactus@mentorup.info', email, EmailTemplate.USER_SIGN_UP_CONFIRMATION, {
        userName: username,
        userEmail: email
      })
    } catch (error) {
      console.error('Failed to send welcome email:', error)
    }

    return respData(user)
  } catch (error) {
    console.error('Error saving new user:', error)
    return respErr('Failed to create user')
  }
}

export async function POST(req: Request) {
  try {
    console.log(' Clerk webhook request received')

    const evt = await verifyWebhook(req)
    console.log(` Webhook verified successfully: ${evt.type}`)

    if (evt.type === 'user.created') {
      const { id: userId, email_addresses, first_name, last_name } = evt.data
      const primaryEmail = email_addresses?.[0]?.email_address
      const image_url = evt.data.image_url

      console.log('Processing user.created event:', { userId, primaryEmail, image_url })

      if (!primaryEmail) {
        throw new Error('No primary email found for user')
      }

      const username = first_name && last_name ? `${first_name} ${last_name}` : first_name || last_name || 'User'
      await saveNewUser(userId, primaryEmail, username, image_url)

      console.log('User created successfully via webhook')
    }

    // Return standard HTTP response that Clerk expects
    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('❌ Error processing Clerk webhook:', err)
    // Return proper error response
    return new Response('Webhook verification failed', { status: 400 })
  }
}