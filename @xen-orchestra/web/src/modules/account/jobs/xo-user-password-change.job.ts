import { changeXoUserPasswordPayloadArg } from '@/modules/account/jobs/xo-user-password-change-args.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type ChangeXoUserPasswordPayload = {
  oldPassword: string
  newPassword: string
}

export const useXoUserPasswordChangeJob = defineJob('user.change-password', [changeXoUserPasswordPayloadArg], () => {
  const { t } = useI18n()

  return {
    async run(payload) {
      await fetchPost('users/me/password', payload)
    },

    validate(isRunning, payload) {
      if (isRunning) {
        throw new JobRunningError(t('job:password-change:in-progress'))
      }

      if (payload === undefined) {
        return
      }

      if (payload.oldPassword === '' || payload.newPassword === '') {
        throw new JobError(t('job:arg:password-required'))
      }
    },
  }
})
