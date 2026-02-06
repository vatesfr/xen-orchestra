import * as CMType from './complex-matcher.mjs'
import { Branded } from '../common.mjs'

export type SupportedActionsByResource = {
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
type GetKeysRecursively<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends object
    ? K extends string
      ? `${Prefix}${K}` | GetKeysRecursively<T[K], `${Prefix}${K}:`>
      : never
    : K extends string
      ? `${Prefix}${K}`
      : never
}[keyof T]

export type XoSupportedResource<TActionsByResource extends SupportedActionsByResource> = keyof TActionsByResource

export type XoSupportedActions<
  TActionsByResource extends SupportedActionsByResource,
  TResource extends XoSupportedResource<TActionsByResource>,
> = (GetKeysRecursively<TActionsByResource[TResource]> & string) | '*'

export type XoRole =
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

export type XoPrivilege<
  TActionsByResource extends SupportedActionsByResource,
  TResource extends XoSupportedResource<TActionsByResource>,
> = {
  id: Branded<'acl-v2-privilege'>
  resource: TResource
  action: XoSupportedActions<TActionsByResource, TResource>
  selector?: CMType.Id<string> | Record<string, unknown>
  effect: 'allow' | 'deny'
  roleId: XoRole['id']
}
