import { newAuthenticationTokenPayloadArg } from '@/modules/account/jobs/xo-authentication-token-create-args.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type NewAuthenticationTokenPayload = {
  description: string
  expiresIn?: number
}

export const useXoAuthenticationTokenCreateJob = defineJob(
  'authentication-token.create',
  [newAuthenticationTokenPayloadArg],
  () => {
    const { t } = useI18n()

    return {
      async run(payload) {
        await fetchPost('users/me/authentication_tokens', payload)
      },

      validate(isRunning) {
        if (isRunning) {
          throw new JobRunningError(t('job:create:in-progress'))
        }
      },
    }
  }
)
