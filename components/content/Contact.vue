<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '#ui/types'

// TypeScript declaration for Google reCAPTCHA
declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

const { t } = useI18n()

const isResendEnabled = useRuntimeConfig().public.resend

const state = ref({
  email: '',
  message: '',
  subject: '',
  honeypot: '',
})

const schema = z.object({
  email: z.string().email('Invalid email'),
  message: z.string().min(10, 'Message is too short'),
  subject: z.string().min(5, 'Subject is too short'),
})
type Schema = z.output<typeof schema>

const loading = ref(false)
const config = useRuntimeConfig()
const recaptchaSiteKey = config.public.recaptchaSiteKey

// Wait for reCAPTCHA to load
const recaptchaReady = ref(false)

onMounted(() => {
  if (typeof window !== 'undefined' && recaptchaSiteKey) {
    // Load reCAPTCHA v3 script dynamically with site key
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          recaptchaReady.value = true
        })
      }
    }
    document.head.appendChild(script)
  } else {
    recaptchaReady.value = true // Allow form to work without reCAPTCHA in dev
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    // Get reCAPTCHA token if available
    let recaptchaToken = ''
    if (recaptchaSiteKey && recaptchaReady.value && typeof window !== 'undefined' && window.grecaptcha) {
      try {
        recaptchaToken = await window.grecaptcha.execute(recaptchaSiteKey, { action: 'submit' })
      } catch (error) {
        console.error('reCAPTCHA error:', error)
      }
    }

    await $fetch('/api/emails/send', {
      method: 'POST',
      body: {
        ...event.data,
        honeypot: state.value.honeypot,
        'recaptcha-token': recaptchaToken,
      },
    })
    state.value = {
      email: '',
      message: '',
      subject: '',
      honeypot: '',
    }
    toast.success(t('contact.success'))
  }
  catch {
    toast.error(t('contact.error'))
  }
  loading.value = false
}
</script>

<template>
  <section class="mx-auto mt-4 flex max-w-4xl flex-col p-7 sm:mt-20">
    <h1 class="text-white-shadow text-4xl">
      <slot
        name="title"
        mdc-unwrap="p"
      />
    </h1>
    <h2 class="text-lg font-extralight text-muted">
      <slot
        name="subtitle"
        mdc-unwrap="p"
      />
    </h2>
    <Divider class="mb-8 mt-2" />
    <div class="flex flex-col sm:justify-between">
      <UForm
        :state
        :schema
        class="flex w-full max-w-[40rem] flex-col gap-3"
        @submit="onSubmit"
      >
        <UFormField
          label="Email"
          name="email"
          required
        >
          <UInput
            v-model="state.email"
            autocomplete="email"
            class="w-full"
            placeholder="john.doe@gmail.com"
          />
        </UFormField>

        <UFormField
          label="Subject"
          name="subject"
          required
        >
          <UInput
            v-model="state.subject"
            class="w-full"
            :placeholder="$t('contact.subject')"
          />
        </UFormField>

        <UFormField
          label="Message"
          name="message"
          required
        >
          <UTextarea
            v-model="state.message"
            autoresize
            class="w-full"
            :rows="4"
            placeholder="Lets work together!"
          />
        </UFormField>
        
        <!-- Honeypot field - hidden from users but visible to bots -->
        <div style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;">
          <label for="website">Website (leave blank)</label>
          <input
            id="website"
            v-model="state.honeypot"
            type="text"
            name="website"
            autocomplete="off"
            tabindex="-1"
          />
        </div>
        
        <div class="flex justify-center">
          <UTooltip
            :disabled="!isResendEnabled"
            :text="$t('contact.disabled')"
          >
            <UButton
              :loading
              :disabled="!isResendEnabled"
              type="submit"
              block
            >
              {{ $t("contact.submit") }}
            </UButton>
          </UTooltip>
        </div>
      </UForm>
    </div>
  </section>
</template>
