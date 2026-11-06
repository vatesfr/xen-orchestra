import { xoGroupsArg } from '@/modules/group/jobs/xo-group-args.ts'
import { type FrontXoGroup, useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import { xoRolesArg } from '@/modules/role/jobs/xo-role-args.ts'
import { type FrontXoRole, useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoRoleGroupsRemoveJob = defineJob('role.groups.remove', [xoRolesArg, xoGroupsArg], () => {
  const { t } = useI18n()

  const { $context: roleContext } = useXoRoleCollection()

  const { $context: groupContext } = useXoGroupCollection()

  return {
    async run(roles: FrontXoRole[], groups: FrontXoGroup[]) {
      const results = await Promise.allSettled(
        roles.flatMap(role => groups.map(group => fetchDelete(`acl-roles/${role.id}/groups/${group.id}`)))
      )

      results
        .filter(result => result.status === 'rejected')
        .forEach(result => console.error('Failed to unassign a role from a group:', result.reason))

      roleContext.forceReload()
      groupContext.forceReload()

      return results
    },

    validate: (isRunning, roles: FrontXoRole[], groups: FrontXoGroup[]) => {
      if (roles.length === 0) {
        throw new JobError(t('job:role-groups:missing-role'))
      }

      if (groups.length === 0) {
        throw new JobError(t('job:role-groups:missing-group'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:detach:in-progress'))
      }
    },
  }
})
