import { required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoUser } from '@vates/types'
import { computedAsync } from '@vueuse/core'
import { generateSecret, generateURI, verify } from 'otplib'
import { toDataURL } from 'qrcode'
import { type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type EnableOtpFormData = {
  code: string
}

export function useEnableOtpForm(rawUser: MaybeRefOrGetter<XoUser>) {
  const { t } = useI18n()

  const user = toComputed(rawUser)

  const secret = generateSecret()

  const qrCodeUrl = computedAsync(() =>
    toDataURL(generateURI({ issuer: 'Xen Orchestra', label: user.value.email, secret }))
  )

  const formData = reactive<EnableOtpFormData>({ code: '' })

  async function isCodeValid(code: string) {
    if (code === '') {
      return true
    }

    try {
      const { valid } = await verify({ secret, token: code, epochTolerance: 30 })

      return valid
    } catch {
      return false
    }
  }

  const { useField, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        code: {
          required,
          validCode: withMessage(isCodeValid, () => t('invalid-code')),
        },
      }),
    },
  })

  async function validateAndGetSecret() {
    return (await validate()) ? secret : undefined
  }

  return {
    secret,
    qrCodeUrl,
    validateAndGetSecret,
    codeInputBindings: useField('code', () => ({ label: t('verification-code'), required: true })),
  }
}
