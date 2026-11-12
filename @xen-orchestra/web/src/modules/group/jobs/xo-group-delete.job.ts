import { xoGroupsArg } from '@/modules/group/jobs/xo-group-args.ts'
import { type FrontXoGroup, useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoGroupDeleteJob = defineJob('group.delete', [xoGroupsArg], () => {
  const { t } = useI18n()

  const { $context: groupContext } = useXoGroupCollection()

  const { $context: userContext } = useXoUserCollection()

  return {
    async run(groups: FrontXoGroup[]) {
      const results = await Promise.allSettled(groups.map(group => fetchDelete(`groups/${group.id}`)))

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to delete group ${groups[index].id}:`, result.reason)
        }
      })

      groupContext.forceReload()
      userContext.forceReload()

      return results
    },

    validate: (isRunning, groups: FrontXoGroup[]) => {
      if (groups.length === 0) {
        throw new JobError(t('job:group-delete:missing-group'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }

      if (groups.some(group => group.provider !== undefined)) {
        throw new JobError(t('job:group-delete:synchronized-group'))
      }
    },
  }
})
