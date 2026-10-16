import { xoGroupsArg } from '@/modules/group/jobs/xo-group-args.ts'
import { type FrontXoGroup, useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import { xoUsersArg } from '@/modules/user/jobs/xo-user-args.ts'
import { type FrontXoUser, useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoGroupUsersRemoveJob = defineJob('group.users.remove', [xoGroupsArg, xoUsersArg], () => {
  const { t } = useI18n()

  const { $context: groupContext } = useXoGroupCollection()

  const { $context: userContext } = useXoUserCollection()

  return {
    async run(groups: FrontXoGroup[], users: FrontXoUser[]) {
      const results = await Promise.allSettled(
        groups.flatMap(group => users.map(user => fetchDelete(`groups/${group.id}/users/${user.id}`)))
      )

      results
        .filter(result => result.status === 'rejected')
        .forEach(result => console.error('Failed to remove a user from a group:', result.reason))

      groupContext.forceReload()
      userContext.forceReload()

      return results
    },

    validate: (isRunning, groups: FrontXoGroup[], users: FrontXoUser[]) => {
      if (groups.length === 0) {
        throw new JobError(t('job:group-users:missing-group'))
      }

      if (users.length === 0) {
        throw new JobError(t('job:group-users:missing-user'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:detach:in-progress'))
      }

      if (groups.some(group => group.provider !== undefined)) {
        throw new JobError(t('job:group-users:synchronized-group'))
      }
    },
  }
})
