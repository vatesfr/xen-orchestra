import { xoAuthenticationTokenArg } from '@/modules/account/jobs/xo-authentication-token-args.ts'
import { editAuthenticationTokenPayloadArg } from '@/modules/account/jobs/xo-authentication-token-edit-args.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type EditAuthenticationTokenPayload = {
  description: string
}

export const useXoAuthenticationTokenEditJob = defineJob(
  'authentication-token.edit',
  [xoAuthenticationTokenArg, editAuthenticationTokenPayloadArg],
  () => {
    const { t } = useI18n()

    return {
      async run(token, payload) {
        await fetchPatch(`users/me/authentication_tokens/${token.id}`, payload)
      },

      validate(isRunning, token) {
        if (token === undefined) {
          throw new JobError(t('job:arg:authentication-token-required'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:edit:in-progress'))
        }
      },
    }
  }
)
