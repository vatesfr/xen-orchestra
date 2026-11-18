import { sshKeyPayloadArg } from '@/modules/account/jobs/xo-ssh-key-create-args.ts'
import { xoUserArg } from '@/modules/user/jobs/xo-user-args.ts'
import { getXoUserSshKeys } from '@/modules/user/utils/xo-user.util.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoSshKeyCreateJob = defineJob('ssh-key.create', [xoUserArg, sshKeyPayloadArg], () => {
  const { t } = useI18n()

  return {
    async run(user, sshKey) {
      await fetchPatch(`users/${user.id}`, { preferences: { sshKeys: [...getXoUserSshKeys(user), sshKey] } })
    },

    validate(isRunning, user, sshKey) {
      if (user === undefined) {
        throw new JobError(t('job:arg:user-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (sshKey === undefined) {
        return
      }

      if (sshKey.key === '') {
        throw new JobError(t('job:ssh-key-create:key-required'))
      }

      if (getXoUserSshKeys(user).some(({ key }) => key === sshKey.key)) {
        throw new JobError(t('job:ssh-key-create:key-already-exists'))
      }
    },
  }
})
