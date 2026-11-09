import { xoRolesArg } from '@/modules/role/jobs/xo-role-args.ts'
import { type FrontXoRole, useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import { xoUsersArg } from '@/modules/user/jobs/xo-user-args.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { fetchPut } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoRoleUsersAddJob = defineJob('role.users.add', [xoRolesArg, xoUsersArg], () => {
  const { t } = useI18n()

  const { $context } = useXoRoleCollection()

  return {
    async run(roles: FrontXoRole[], users: FrontXoUser[]) {
      const results = await Promise.allSettled(
        roles.flatMap(role => users.map(user => fetchPut(`acl-roles/${role.id}/users/${user.id}`)))
      )

      results
        .filter(result => result.status === 'rejected')
        .forEach(result => console.error('Failed to assign a role to a user:', result.reason))

      $context.forceReload()

      return results
    },

    validate: (isRunning, roles: FrontXoRole[], users: FrontXoUser[]) => {
      if (roles.length === 0) {
        throw new JobError(t('job:role-users:missing-role'))
      }

      if (users.length === 0) {
        throw new JobError(t('job:role-users:missing-user'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:add:in-progress'))
      }
    },
  }
})
