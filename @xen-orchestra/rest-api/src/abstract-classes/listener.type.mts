import type { XoUser } from '@vates/types'
import type { AnyPrivilege } from '@xen-orchestra/acl'

export type UserPrivileges = { user: XoUser; userPrivileges: AnyPrivilege[] }

export type PrivilegesChange = UserPrivileges & { previousUser: XoUser; previousUserPrivileges: AnyPrivilege[] }
