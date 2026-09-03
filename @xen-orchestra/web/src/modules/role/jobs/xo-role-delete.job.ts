import { xoRolesArg } from '@/modules/role/jobs/xo-role-args.ts'
import { type FrontXoRole, useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoRoleDeleteJob = defineJob('role.delete', [xoRolesArg], () => {
  const { t } = useI18n()

  const { $context } = useXoRoleCollection()

  return {
    async run(roles: FrontXoRole[]) {
      const results = await Promise.allSettled(roles.map(role => fetchDelete(`acl-roles/${role.id}`)))

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to delete role ${roles[index].id}:`, result.reason)
        }
      })

      $context.forceReload()

      return results
    },

    validate: (isRunning, roles: FrontXoRole[]) => {
      if (roles.length === 0) {
        throw new JobError(t('job:role-delete:missing-role'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }

      if (roles.some(role => role.userIds.length > 0 || role.groupIds.length > 0)) {
        throw new JobError(t('job:role-delete:role-assigned'))
      }
    },
  }
})
