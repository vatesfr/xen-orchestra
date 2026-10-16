import { type FrontXoGroup, useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import { type FrontXoRole, useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export type UserRole = FrontXoRole & {
  isDirect: boolean
  inheritedFromGroups: FrontXoGroup[]
}

export function getUserRoles(user: FrontXoUser, roles: FrontXoRole[], userGroups: FrontXoGroup[]): UserRole[] {
  return roles.flatMap(role => {
    const isDirect = role.userIds.includes(user.id)

    const inheritedFromGroups = userGroups.filter(group => role.groupIds.includes(group.id))

    if (!isDirect && inheritedFromGroups.length === 0) {
      return []
    }

    return [{ ...role, isDirect, inheritedFromGroups }]
  })
}

export function useXoUserRoles(rawUser: MaybeRefOrGetter<FrontXoUser>) {
  const { roles, areRolesReady, hasRoleFetchError } = useXoRoleCollection()

  const { useGetGroupsByIds, areGroupsReady, hasGroupFetchError } = useXoGroupCollection()

  const userGroups = useGetGroupsByIds(() => toValue(rawUser).groups)

  const userRoles = computed(() => getUserRoles(toValue(rawUser), roles.value, userGroups.value))

  const areUserRolesReady = computed(() => areRolesReady.value && areGroupsReady.value)

  const hasUserRoleFetchError = computed(() => hasRoleFetchError.value || hasGroupFetchError.value)

  return { userRoles, areUserRolesReady, hasUserRoleFetchError }
}
