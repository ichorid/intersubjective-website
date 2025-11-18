import { Resend } from 'resend'
import type { H3Event } from 'h3'

const resend = new Resend(process.env.NUXT_PRIVATE_RESEND_API_KEY)

async function verifyRecaptcha(token: string, secretKey: string): Promise<{ success: boolean; score?: number }> {
  if (!token || !secretKey) {
    return { success: false }
  }

  try {
    const response = await $fetch<{ success: boolean; score?: number; 'error-codes'?: string[] }>(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )

    return {
      success: response.success === true,
      score: response.score,
    }
  }
  catch (error) {
    console.error('reCAPTCHA verification error:', error)
    return { success: false }
  }
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event)
    const config = useRuntimeConfig()
    const { email, subject, message, honeypot, 'recaptcha-token': recaptchaToken } = body

    // Verify honeypot - if filled, it's likely a bot
    if (honeypot && honeypot.trim() !== '') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Spam detected',
      })
    }

    // Verify reCAPTCHA token if secret key is configured
    const recaptchaSecretKey = config.private.recaptchaSecretKey
    if (recaptchaSecretKey) {
      if (!recaptchaToken) {
        throw createError({
          statusCode: 400,
          statusMessage: 'reCAPTCHA verification required',
        })
      }

      const recaptchaResult = await verifyRecaptcha(recaptchaToken, recaptchaSecretKey)
      
      if (!recaptchaResult.success) {
        throw createError({
          statusCode: 400,
          statusMessage: 'reCAPTCHA verification failed',
        })
      }

      // Check score (0.0 to 1.0, where 1.0 is very likely a human)
      // Reject submissions with score < 0.5
      if (recaptchaResult.score !== undefined && recaptchaResult.score < 0.5) {
        throw createError({
          statusCode: 400,
          statusMessage: 'reCAPTCHA score too low',
        })
      }
    }

    return await resend.emails.send({
      from: 'Intersubjective <contact@intersubjective.space>',
      to: [config.public.contactEmail as string],
      subject: 'New message from Intersubjective',
      html: `
      <p>A new message has been sent from the contact form of Intersubjective.</p>
      <p>Here are the details of the message :</p>
      <ul>
        <li>Email : ${email}</li>
        <li>Subject : ${subject}</li>
        <li>Message : ${message}</li>
      </ul>
      `,
    })
  }
  catch (error) {
    if (error.statusCode) {
      throw error
    }
    return { error }
  }
})
