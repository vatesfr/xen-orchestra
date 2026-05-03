import assert from 'node:assert'
import type { XoUser } from '@vates/types/xo'

import { SUPPORTED_ACTIONS_BY_RESOURCE } from './actions/index.mjs'
import {
  Privilege as CPrivilege,
  TPrivilege as Privilege,
  SupportedActions,
  SupportedActionsByResource,
  SupportedResource,
} from './class/privilege.mjs'

// Export all types constructed using SUPPORTED_ACTIONS_BY_RESOURCE
export type { Privilege, SupportedActions, SupportedActionsByResource, SupportedResource }
export { SUPPORTED_ACTIONS_BY_RESOURCE }

export type * from './generated/privilege-types.mjs'

import { AnyPrivilege } from './generated/privilege-types.mjs'

export type AnyPrivilegeOnParam = {
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
  return params
    .filter(
      param =>
        !hasPrivilegeOn({
          user: param.user,
          resource: param.resource,
          action: param.action as SupportedActions<typeof param.resource>,
          objects: param.objects,
          userPrivileges,
        })
    )
    .map(({ action, objects, resource }) => {
      let objectIds: unknown[] | undefined
      let objectId: unknown | undefined

      if (Array.isArray(objects)) {
        if (objects.length > 1) {
          objectIds = []
          objects.forEach(obj => {
            if ('id' in obj) {
              objectIds!.push(obj.id)
            }
          })
        } else {
          objects = objects?.[0] ?? {}
        }
      }
      if (!Array.isArray(objects)) {
        objectId = 'id' in objects ? objects.id : undefined
      }

      return {
        objectId,
        objectIds,
        action,
        resource,
      }
    })
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

// Utils

/**
 * Mirror GetKeysRecursively from @vates/types
 */
export function getActionStrings<Resource extends SupportedResource, Actions = SupportedActions<Resource>>(
  resource: Resource
): Actions[] {
  type NestedActions = { [key: string]: boolean | NestedActions }

  function collectActions(obj: NestedActions, prefix?: Actions): Actions[] {
    const actions: Actions[] = ['*' as Actions]

    for (const [key, value] of Object.entries(obj)) {
      const action = (prefix !== undefined ? `${prefix}:${key}` : key) as Actions
      actions.push(action)

      if (typeof value === 'boolean') {
        continue
      }

      actions.push(...collectActions(value, action))
    }

    return actions
  }

  return collectActions(SUPPORTED_ACTIONS_BY_RESOURCE[resource])
}
