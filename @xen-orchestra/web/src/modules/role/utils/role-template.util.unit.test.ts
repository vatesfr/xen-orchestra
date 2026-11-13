import type { FrontXoPrivilege } from '@/modules/role/remote-resources/use-xo-role-privileges-collection.ts'
import type { FrontXoRoleTemplate } from '@/modules/role/remote-resources/use-xo-role-template-collection.ts'
import { toNewRolePayload } from '@/modules/role/utils/role-template.util.ts'

const roleTemplate: FrontXoRoleTemplate = {
  id: 'role-template-1' as FrontXoRoleTemplate['id'],
  name: 'VMs creator',
  description: 'Allow to create VMs',
  privilegeIds: [],
  isTemplate: true,
}

describe('toNewRolePayload', () => {
  it('takes the name and the description of the template', () => {
    expect(toNewRolePayload(roleTemplate, [])).toEqual({
      name: 'VMs creator',
      description: 'Allow to create VMs',
      privileges: [],
    })
  })

  it('takes the privileges of the template without their id', () => {
    const privileges: FrontXoPrivilege[] = [
      { id: 'privilege-1' as FrontXoPrivilege['id'], resource: 'pool', action: 'create:vm', effect: 'allow' },
      {
        id: 'privilege-2' as FrontXoPrivilege['id'],
        resource: 'vm',
        action: '*',
        effect: 'deny',
        selector: 'tags:production',
      },
    ]

    expect(toNewRolePayload(roleTemplate, privileges).privileges).toEqual([
      { resource: 'pool', action: 'create:vm', effect: 'allow' },
      { resource: 'vm', action: '*', effect: 'deny', selector: 'tags:production' },
    ])
  })

  it('drops the href added by the REST API', () => {
    const privilegeFromApi = {
      id: 'privilege-1' as FrontXoPrivilege['id'],
      resource: 'pool',
      action: 'create:vm',
      effect: 'allow',
      href: '/rest/v0/acl-privileges/privilege-1',
    } as const

    expect(toNewRolePayload(roleTemplate, [privilegeFromApi]).privileges).toStrictEqual([
      { resource: 'pool', action: 'create:vm', effect: 'allow' },
    ])
  })
})
