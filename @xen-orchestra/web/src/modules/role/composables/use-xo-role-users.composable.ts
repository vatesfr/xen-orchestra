import { type FrontXoGroup, useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import { getRoleUserIds } from '@/modules/role/utils/xo-role.util.ts'
import { type FrontXoUser, useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export type RoleUser = FrontXoUser & {
  isDirect: boolean
}

export function getRoleUsers(role: FrontXoRole, users: FrontXoUser[], roleGroups: FrontXoGroup[]): RoleUser[] {
  const roleUserIds = getRoleUserIds(role, roleGroups)

  return users
    .filter(user => roleUserIds.includes(user.id))
    .map(user => ({ ...user, isDirect: role.userIds.includes(user.id) }))
}

export function useXoRoleUsers(rawRole: MaybeRefOrGetter<FrontXoRole>) {
  const { users, areUsersReady, hasUserFetchError } = useXoUserCollection()

  const { useGetGroupsByIds, areGroupsReady, hasGroupFetchError } = useXoGroupCollection()

  const roleGroups = useGetGroupsByIds(() => toValue(rawRole).groupIds)

  const roleUsers = computed(() => getRoleUsers(toValue(rawRole), users.value, roleGroups.value))

  const areRoleUsersReady = computed(() => areUsersReady.value && areGroupsReady.value)

  const hasRoleUserFetchError = computed(() => hasUserFetchError.value || hasGroupFetchError.value)

  return { roleUsers, areRoleUsersReady, hasRoleUserFetchError }
}
