import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import { getRoleUserIds } from '@/modules/role/utils/xo-role.util.ts'

type UserId = FrontXoRole['userIds'][number]

function createRole(userIds: string[]): FrontXoRole {
  return {
    id: 'role-1' as FrontXoRole['id'],
    name: 'Test Role',
    description: undefined,
    userIds: userIds as UserId[],
    groupIds: [],
    privilegeIds: [],
  }
}

function createGroup(users: string[]): FrontXoGroup {
  return {
    id: 'group-1' as FrontXoGroup['id'],
    name: 'Test Group',
    users: users as UserId[],
    aclRoleIds: [],
  }
}

describe('getRoleUserIds', () => {
  it('unions the direct users with the members of the role groups', () => {
    const role = createRole(['user-1'])

    expect(getRoleUserIds(role, [createGroup(['user-2', 'user-3'])])).toEqual(
      expect.arrayContaining(['user-1', 'user-2', 'user-3'])
    )
  })

  it('counts once a user holding the role both directly and through a group', () => {
    const role = createRole(['user-1'])

    expect(getRoleUserIds(role, [createGroup(['user-1', 'user-2'])])).toHaveLength(2)
  })

  it('counts once a user member of several role groups', () => {
    const role = createRole([])

    expect(getRoleUserIds(role, [createGroup(['user-1']), createGroup(['user-1', 'user-2'])])).toHaveLength(2)
  })

  it('ignores an empty group', () => {
    const role = createRole(['user-1'])

    expect(getRoleUserIds(role, [createGroup([])])).toEqual(['user-1'])
  })
})
