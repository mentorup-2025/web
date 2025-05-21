import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { CreateUserInput } from '@/types/user'
import { respData, respErr, respOk } from '@/lib/resp'
import { EmailTemplate } from '@/types/email'

async function saveNewUser(userId: string, email: string, username: string) {
  try {
    const userData: CreateUserInput = {
      user_id: userId,
      email: email,
      username: username
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/insert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create user')
    }

    // Send welcome email
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'contactus@mentorup.info',
        to: email,
        type: EmailTemplate.USER_SIGN_UP_CONFIRMATION,
        message: {
          userName: username,
          userEmail: email
        }
      }),
    })

    if (!emailResponse.ok) {
      console.error('Failed to send welcome email:', await emailResponse.json())
      // Don't throw error here as user is already created
    }

    return respData((await response.json()).data)
  } catch (error) {
    console.error('Error saving new user:', error)
    return respErr('Failed to create user')
  }
}

export async function POST(req: Request) {
  try {
    const evt = await verifyWebhook(req)

    // Do something with payload
    // For this guide, log payload to console
    const { id } = evt.data
    const eventType = evt.type
    console.log(`Received webhook with ID ${id} and event type of ${eventType}`)
    console.log('Webhook payload:', evt.data)

    if (evt.type === 'user.created') {
      const { id: userId, email_addresses, first_name, last_name } = evt.data
      const primaryEmail = email_addresses?.[0]?.email_address
      
      if (!primaryEmail) {
        throw new Error('No primary email found for user')
      }

      await saveNewUser(userId, primaryEmail, first_name + ' ' + last_name)
    }

    return respOk()
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return respErr('Error verifying webhook')
  }
}