import { sshKeysArg } from '@/modules/account/jobs/xo-ssh-key-args.ts'
import { xoUserArg } from '@/modules/user/jobs/xo-user-args.ts'
import { getXoUserSshKeys } from '@/modules/user/utils/xo-user.util.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoSshKeyDeleteJob = defineJob('ssh-key.delete', [xoUserArg, sshKeysArg], () => {
  const { t } = useI18n()

  return {
    async run(user, sshKeys) {
      const deletedKeys = new Set(sshKeys.map(({ key }) => key))

      await fetchPatch(`users/${user.id}`, {
        preferences: { sshKeys: getXoUserSshKeys(user).filter(({ key }) => !deletedKeys.has(key)) },
      })
    },

    validate(isRunning, user, sshKeys) {
      if (user === undefined) {
        throw new JobError(t('job:arg:user-required'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }

      if (sshKeys.length === 0) {
        throw new JobError(t('job:ssh-key-delete:missing-ssh-key'))
      }
    },
  }
})
