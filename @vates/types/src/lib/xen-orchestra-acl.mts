import { Branded } from '../common.mjs'
import type { XoGroup, XoUser } from '../xo.mjs'

export type XoAclRole =
  | {
      id: Branded<'acl-v2-role'>
      name: string
      description?: string
    }
  | {
      id: Branded<'acl-v2-role'>
      name: string
      description?: string
      isTemplate: true
      roleTemplateId: number
    }

export type XoUserRole = {
  id: string
  roleId: XoAclRole['id']
  userId: XoUser['id']
}

export type XoGroupRole = {
  id: string
  roleId: XoAclRole['id']
  groupId: XoGroup['id']
}
