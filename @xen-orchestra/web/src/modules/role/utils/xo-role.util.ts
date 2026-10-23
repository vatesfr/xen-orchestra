import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'

export function getRoleUserIds(role: FrontXoRole, roleGroups: FrontXoGroup[]) {
  return Array.from(new Set([...roleGroups.flatMap(group => group.users), ...role.userIds]))
}
