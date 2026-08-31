import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'

// A user holds a role either directly or through one of its groups, and can hold it both ways at
// once, so the same user is only counted once.
export function getRoleUserIds(role: FrontXoRole, roleGroups: FrontXoGroup[]) {
  return Array.from(new Set([...roleGroups.flatMap(group => group.users), ...role.userIds]))
}
