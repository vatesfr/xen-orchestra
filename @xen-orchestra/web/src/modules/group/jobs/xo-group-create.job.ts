import { newGroupArg } from '@/modules/group/jobs/xo-group-args.ts'
import { type FrontXoGroup, useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import type { NewGroupPayload } from '@/modules/group/types.ts'
import { useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { fetchPost, fetchPut } from '@/shared/utils/fetch.util.ts'
import { settleSequentially } from '@/shared/utils/promise.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoGroupCreateJob = defineJob('group.create', [newGroupArg], () => {
  const { t } = useI18n()

  const { $context: groupContext } = useXoGroupCollection()

  const { $context: roleContext } = useXoRoleCollection()

  const { $context: userContext } = useXoUserCollection()

  return {
    async run({ group, roleIds, userIds }: NewGroupPayload) {
      const { id } = await fetchPost<{ id: FrontXoGroup['id'] }>('groups', group)

      const results = await Promise.all([
        Promise.allSettled(roleIds.map(roleId => fetchPut(`acl-roles/${roleId}/groups/${id}`))),
        settleSequentially(userIds.map(userId => () => fetchPut(`groups/${id}/users/${userId}`))),
      ])

      results
        .flat()
        .filter(result => result.status === 'rejected')
        .forEach(result => console.error('Failed to assign a role or a user to the new group:', result.reason))

      groupContext.forceReload()
      roleContext.forceReload()
      userContext.forceReload()

      return id
    },

    validate: (isRunning, payload: NewGroupPayload | undefined) => {
      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (payload === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }
    },
  }
})
