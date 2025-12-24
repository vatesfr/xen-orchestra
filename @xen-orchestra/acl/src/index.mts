import type * as CMType from '@vates/types/lib/complex-matcher'
import assert from 'node:assert'
import type { Branded } from '@vates/types/common'
import type { XoUser } from '@vates/types/xo'

import { Privilege as CPrivilege, SupportedActions, SupportedResource } from './class/privilege.mjs'

export type Role =
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

export type Privilege<T extends SupportedResource> = {
  id: Branded<'acl-v2-privilege'>
  action: SupportedActions<T>
  /**
   * If undefined, target ALL objects of the resource
   */
  selector?: CMType.Id<string> | Record<string, unknown>
  effect: 'allow' | 'deny'
  resource: T
  roleId: Role['id']
}

export function hasPrivilegeOn<T extends SupportedResource>({
  user,
  action,
  resource,
  objects,
  userPrivileges,
}: {
  user: XoUser
  action: Privilege<T>['action']
  resource: Privilege<T>['resource']
  objects: unknown | unknown[]
  userPrivileges: Privilege<SupportedResource>[]
}) {
  // Function that will be called outside of the module
  // We cannot be sure types are respected
  assert.strictEqual(typeof user?.permission, 'string')
  assert.strictEqual(typeof action, 'string')
  assert.strictEqual(typeof resource, 'string')
  assert.strictEqual(objects === undefined, false)

  CPrivilege.checkActionIsValid(action, resource)

  if (user.permission === 'admin') {
    return true
  }

  const arrayObjects = Array.isArray(objects) ? objects : [objects]

  return arrayObjects.every(object => {
    const privilegesThatMatch = userPrivileges.filter(userPrivilege => {
      return new CPrivilege(userPrivilege).match({ action, resource, object })
    })
    if (privilegesThatMatch.length === 0 || privilegesThatMatch.some(p => p.effect === 'deny')) {
      return false
    }

    return true
  })
}

export function hasPrivileges(
  params: Omit<Parameters<typeof hasPrivilegeOn>[0], 'userPrivileges'>[],
  userPrivileges: Privilege<SupportedResource>[]
) {
  return params.every(param => hasPrivilegeOn({ ...param, userPrivileges }))
}

export function filterObjectsWithPrivilege<T>(
  param: Omit<Parameters<typeof hasPrivilegeOn>[0], 'objects'> & { objects: T[] }
) {
  return param.objects.filter(obj => hasPrivilegeOn({ ...param, objects: obj }))
}
