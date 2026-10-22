import { useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import { useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import { newUserArg } from '@/modules/user/jobs/xo-user-args.ts'
import { type FrontXoUser, useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import type { NewUserPayload } from '@/modules/user/types.ts'
import { fetchPost, fetchPut } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoUserCreateJob = defineJob('user.create', [newUserArg], () => {
  const { t } = useI18n()

  const { $context: userContext } = useXoUserCollection()

  const { $context: groupContext } = useXoGroupCollection()

  const { $context: roleContext } = useXoRoleCollection()

  return {
    async run({ user, groupIds, roleIds }: NewUserPayload) {
      const { id } = await fetchPost<{ id: FrontXoUser['id'] }>('users', user)

      const results = await Promise.allSettled([
        ...groupIds.map(groupId => fetchPut(`groups/${groupId}/users/${id}`)),
        ...roleIds.map(roleId => fetchPut(`acl-roles/${roleId}/users/${id}`)),
      ])

      results
        .filter(result => result.status === 'rejected')
        .forEach(result => console.error('Failed to assign a group or a role to the new user:', result.reason))

      userContext.forceReload()
      groupContext.forceReload()
      roleContext.forceReload()

      return id
    },

    validate: (isRunning, payload: NewUserPayload | undefined) => {
      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (payload === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }
    },
  }
})
