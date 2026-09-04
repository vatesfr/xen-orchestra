import { xoUsersArg } from '@/modules/user/jobs/xo-user-args.ts'
import { useXoCurrentUser } from '@/modules/user/remote-resources/use-xo-current-user.ts'
import { type FrontXoUser, useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoUserDeleteJob = defineJob('user.delete', [xoUsersArg], () => {
  const { t } = useI18n()

  const { $context } = useXoUserCollection()

  const { currentUser } = useXoCurrentUser()

  return {
    async run(users: FrontXoUser[]) {
      const results = await Promise.allSettled(users.map(user => fetchDelete(`users/${user.id}`)))

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to delete user ${users[index].id}:`, result.reason)
        }
      })

      $context.forceReload()

      return results
    },

    validate: (isRunning, users: FrontXoUser[]) => {
      if (users.length === 0) {
        throw new JobError(t('job:user-delete:missing-user'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }

      if (users.some(user => user.id === currentUser.value?.id)) {
        throw new JobError(t('job:user-delete:self-deletion'))
      }
    },
  }
})
