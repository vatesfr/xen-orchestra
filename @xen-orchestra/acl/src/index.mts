import assert from 'node:assert'
import type { XoUser } from '@vates/types/xo'
import type { XoPrivilege, XoSupportedResource, XoSupportedActions } from '@vates/types/lib/xen-orchestra/acl'

import { Privilege as CPrivilege, SupportedActionsByResource } from './class/privilege.mjs'

// Export all types constructed using SUPPORTED_ACTIONS_BY_RESOURCE
export { SupportedActionsByResource }
export type SupportedResource = XoSupportedResource<SupportedActionsByResource>
export type SupportedActions<T extends SupportedResource> = XoSupportedActions<SupportedActionsByResource, T>
export type Privilege<T extends SupportedResource> = XoPrivilege<SupportedActionsByResource, T>

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
