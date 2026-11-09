import type { PrivilegeAction, PrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import type { LinkOptions } from '@core/composables/link-component.composable.ts'
import type { IconName } from '@core/icons'
import type { XoAclBasePrivilege, XoAclRole } from '@vates/types'

export type NewPrivilegePayload = {
  resource: PrivilegeResource
  action: PrivilegeAction
  effect: XoAclBasePrivilege['effect']
  selector?: XoAclBasePrivilege['selector']
}

export type NewRolePayload = Pick<XoAclRole, 'name' | 'description'> & {
  privileges: NewPrivilegePayload[]
}

export type StagedPrivilege = NewPrivilegePayload & {
  key: string
}

export type PrivilegeScopeObject = {
  id: string
  label: string
  icon?: IconName
  to?: LinkOptions['to']
}
