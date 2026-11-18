import { xoUserArg } from '@/modules/user/jobs/xo-user-args.ts'
import { editXoUserPayloadArg } from '@/modules/user/jobs/xo-user-edit-args.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type EditXoUserPayload = {
  email?: string
  username?: string
  firstname?: string
  lastname?: string
  preferences?: {
    otp: string | null
  }
}

export const useXoUserEditJob = defineJob('user.edit', [xoUserArg, editXoUserPayloadArg], () => {
  const { t } = useI18n()

  return {
    async run(user, payload) {
      await fetchPatch(`users/${user.id}`, payload)
    },

    validate(isRunning, user) {
      if (user === undefined) {
        throw new JobError(t('job:arg:user-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:edit:in-progress'))
      }
    },
  }
})
