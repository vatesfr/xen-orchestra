import type { FrontXoPrivilege } from '@/modules/role/remote-resources/use-xo-role-privileges-collection.ts'
import type { FrontXoRoleTemplate } from '@/modules/role/remote-resources/use-xo-role-template-collection.ts'
import type { NewPrivilegePayload, NewRolePayload } from '@/modules/role/types.ts'
import { objectPick } from '@vueuse/core'

export function getNewRoleFromTemplateRoute(roleTemplateId: FrontXoRoleTemplate['id']) {
  return { name: '/admin/role/new', query: { template: roleTemplateId } } as const
}

export function toNewRolePayload(roleTemplate: FrontXoRoleTemplate, privileges: FrontXoPrivilege[]): NewRolePayload {
  return {
    name: roleTemplate.name,
    description: roleTemplate.description,
    privileges: privileges.map(
      privilege => objectPick(privilege, ['resource', 'action', 'effect', 'selector']) as NewPrivilegePayload
    ),
  }
}
