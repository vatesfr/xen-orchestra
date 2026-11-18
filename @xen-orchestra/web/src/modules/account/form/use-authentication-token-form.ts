import type { NewAuthenticationTokenPayload } from '@/modules/account/jobs/xo-authentication-token-create.job.ts'
import type { XoAuthenticationToken } from '@vates/types'
import { useDateFormat } from '@vueuse/core'
import { reactive } from 'vue'

export type AuthenticationTokenFormData = {
  description: string
  expirationDate: string
}

const END_OF_DAY = 'T23:59:59'

const MAX_EXPIRATION_DAYS = 181

export function useAuthenticationTokenForm(token?: XoAuthenticationToken) {
  const formData = reactive<AuthenticationTokenFormData>({
    description: token?.description ?? '',
    expirationDate: '',
  })

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const minExpirationDate = useDateFormat(tomorrow, 'YYYY-MM-DD')

  const lastAllowedDay = new Date()
  lastAllowedDay.setDate(lastAllowedDay.getDate() + MAX_EXPIRATION_DAYS)

  const maxExpirationDate = useDateFormat(lastAllowedDay, 'YYYY-MM-DD')

  function buildPayload(): NewAuthenticationTokenPayload {
    return {
      description: formData.description,
      ...(formData.expirationDate !== '' && {
        expiresIn: new Date(`${formData.expirationDate}${END_OF_DAY}`).getTime() - Date.now(),
      }),
    }
  }

  return {
    formData,
    minExpirationDate,
    maxExpirationDate,
    buildPayload,
  }
}
