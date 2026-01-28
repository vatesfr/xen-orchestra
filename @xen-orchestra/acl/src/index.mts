import type * as CMType from '@vates/types/lib/complex-matcher'
import assert from 'node:assert'
import type { Branded } from '@vates/types/common'
import type { XoUser } from '@vates/types/xo'

import { Privilege as CPrivilege, SupportedActions, SupportedResource } from './class/privilege.mjs'

type AnyPrivilege = {
  [Resource in SupportedResource]: Privilege<Resource>
}[SupportedResource]

type AnyPrivilegeOnParam = {
  [Resource in SupportedResource]: {
    user: XoUser
    resource: Resource
    action: SupportedActions<Resource>
    objects: object | object[]
  }
}[SupportedResource]

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
  resource: T
  action: SupportedActions<T>
  objects: object | object[]
  userPrivileges: AnyPrivilege[]
}) {
  // Function that will be called outside of the module
  // We cannot be sure types are respected
  assert.strictEqual(typeof user?.permission, 'string')
  assert.strictEqual(typeof action, 'string')
  assert.strictEqual(typeof resource, 'string')
  assert.strictEqual(objects === undefined, false)

  CPrivilege.checkActionIsValid(resource, action as SupportedActions<typeof resource>)

  if (user.permission === 'admin') {
    return true
  }

  const effectsByObject = new Map<object, Privilege<T>['effect'][]>()
  if (Array.isArray(objects)) {
    objects.forEach(obj => effectsByObject.set(obj, []))
  } else {
    effectsByObject.set(objects, [])
  }

  for (const userPrivilege of userPrivileges) {
    const privilege = new CPrivilege(userPrivilege as Privilege<typeof userPrivilege.resource>)

    for (const [object, effects] of effectsByObject.entries()) {
      if (!privilege.match({ action, resource, object })) {
        continue
      }
      effects.push(privilege.effect)
    }
  }

  if (
    Array.from(effectsByObject.values()).some(
      effects => effects.length === 0 || effects.some(effect => effect === 'deny')
    )
  ) {
    return false
  }
  return true
}

export function getMissingPrivileges(params: AnyPrivilegeOnParam[], userPrivileges: AnyPrivilege[]) {
  return params.filter(
    param =>
      !hasPrivilegeOn({
        user: param.user,
        resource: param.resource,
        action: param.action as SupportedActions<typeof param.resource>,
        objects: param.objects,
        userPrivileges,
      })
  )
}

export function hasPrivileges(params: AnyPrivilegeOnParam[], userPrivileges: AnyPrivilege[]) {
  return getMissingPrivileges(params, userPrivileges).length === 0
}

export function filterObjectsWithPrivilege<Resource extends SupportedResource, Object extends object>(param: {
  user: XoUser
  resource: Resource
  action: SupportedActions<Resource>
  objects: Object[]
  userPrivileges: AnyPrivilege[]
}) {
  return param.objects.filter(obj => hasPrivilegeOn({ ...param, objects: obj }))
}
