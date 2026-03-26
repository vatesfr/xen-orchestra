import * as CMType from './complex-matcher.mjs'
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

export type XoAclSupportedActionsByResource = {
  [resource: string]: Record<string, unknown>
}

/**
 * E.g
 * vms {
 *   shutdown: {
 *    clean: true,
 *    hard: true,
 *  }
 * }
 *
 * `shutdown | shutdown:clean | shutdown:hard`
 */
export type GetKeysRecursively<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends object
    ? K extends string
      ? `${Prefix}${K}` | GetKeysRecursively<T[K], `${Prefix}${K}:`>
      : never
    : K extends string
      ? `${Prefix}${K}`
      : never
}[keyof T]

export type XoAclSupportedResource<TActionsByResource extends XoAclSupportedActionsByResource> =
  keyof TActionsByResource

export type XoAclSupportedActions<
  TActionsByResource extends XoAclSupportedActionsByResource,
  TResource extends XoAclSupportedResource<TActionsByResource>,
> = (GetKeysRecursively<TActionsByResource[TResource]> & string) | '*'

export type XoAclBasePrivilege = {
  id: Branded<'acl-v2-privilege'>
  resource: string
  action: string
  selector?: CMType.Id<string> | Record<string, unknown>
  effect: 'allow' | 'deny'
  roleId: XoAclRole['id']
}

export type XoAclPrivilege<
  TActionsByResource extends XoAclSupportedActionsByResource,
  TResource extends XoAclSupportedResource<TActionsByResource>,
> = XoAclBasePrivilege & {
  resource: TResource
  action: XoAclSupportedActions<TActionsByResource, TResource>
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
