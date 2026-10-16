import type { PrivilegeAction, PrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import type { LinkOptions } from '@core/composables/link-component.composable.ts'
import type { IconName } from '@core/icons'
import type { XoAclBasePrivilege, XoAclRole } from '@vates/types'

export type NewPrivilegePayload = {
  resource: PrivilegeResource
  action: PrivilegeAction
  effect: XoAclBasePrivilege['effect']
  // Absent when the privilege applies to every object of the resource.
  selector?: XoAclBasePrivilege['selector']
}

export type NewRolePayload = Pick<XoAclRole, 'name' | 'description'> & {
  privileges: NewPrivilegePayload[]
}

// A privilege staged in the new role form has no server id yet, so it carries a local key
// to stay identifiable in the table while it is being edited or removed.
export type StagedPrivilege = NewPrivilegePayload & {
  key: string
}

// An object a manual selection can target, shaped for the tables and the review of the scope step.
export type PrivilegeScopeObject = {
  id: string
  label: string
  icon?: IconName
  to?: LinkOptions['to']
}
