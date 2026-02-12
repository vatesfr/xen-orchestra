import * as CMType from './complex-matcher.mjs'
import { Branded } from '../common.mjs'

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

export type XoAclPrivilege<
  TActionsByResource extends XoAclSupportedActionsByResource,
  TResource extends XoAclSupportedResource<TActionsByResource>,
> = {
  id: Branded<'acl-v2-privilege'>
  resource: TResource
  action: XoAclSupportedActions<TActionsByResource, TResource>
  selector?: CMType.Id<string> | Record<string, unknown>
  effect: 'allow' | 'deny'
  roleId: XoAclRole['id']
}
