import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type RegisterAppliancePayload = {
  email: string
  password: string
  // remplace l'enregistrement existant, comme `renew` en XO 5
  renew?: boolean
}

const payloadArg = defineJobArg<RegisterAppliancePayload>({
  identify: false,
  toArray: false,
})

export const useXoaRegisterJob = defineJob('xoa.register', [payloadArg], () => {
  const { t } = useI18n()

  return {
    async run(payload: RegisterAppliancePayload) {
      await fetchPost('plugins/xoa/registration', payload)
    },

    validate(isRunning, payload: RegisterAppliancePayload | undefined) {
      if (isRunning) {
        throw new JobRunningError(t('job:xoa-register:in-progress'))
      }

      if (payload === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      if (payload.email === '') {
        throw new JobError(t('job:arg:email-required'))
      }

      if (payload.password === '') {
        throw new JobError(t('job:arg:password-required'))
      }
    },
  }
})
