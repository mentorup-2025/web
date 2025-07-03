import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { CreateUserInput } from '@/types/user'
import { respData, respErr, respOk } from '@/lib/resp'
import { EmailTemplate } from '@/types/email'

async function saveNewUser(userId: string, email: string, username: string, image_url: string) {
  try {
    const userData: CreateUserInput = {
      user_id: userId,
      email: email,
      username: username,
      profile_url: image_url
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