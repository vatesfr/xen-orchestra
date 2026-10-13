import { test as testPermission } from 'xo-acl-resolver'

/**
 * @typedef {(objectId: string) => boolean} IsObjectVisible
 */

/**
 * Builds the predicate deciding whether a user may see an XO object.
 *
 * It is the very same resolver xo-web uses to filter its own store, so the
 * result is identical to what a non-admin UI already displays.
 *
 * The returned predicate memoizes its answers and must therefore not outlive
 * the batch of objects it was created for, as the object graph keeps moving.
 * Its permission map, on the other hand, only changes when permissions do, so
 * callers that already hold one should pass it as `permissionsByObject` and
 * omit `resourceSetObjectIds` rather than have it rebuilt on every batch.
 *
 * @param {object} opts
 * @param {(id: string) => object | undefined} opts.getObject
 * @param {{ [objectId: string]: { [permission: string]: 1 } }} opts.permissionsByObject
 * @param {string[]} [opts.resourceSetObjectIds]
 * @returns {IsObjectVisible}
 */
export function createIsObjectVisible({ getObject, permissionsByObject, resourceSetObjectIds = [] }) {
  const permissions = createPermissions({ permissionsByObject, resourceSetObjectIds })

  const cache = new Map()
  return function isObjectVisible(objectId) {
    if (cache.has(objectId)) {
      return cache.get(objectId)
    } else {
      const visible = testPermission(permissions, getObject, objectId, 'view')
      cache.set(objectId, visible)

      return visible
    }
  }
}

/**
 * Objects of a resource set are granted an implicit `view` permission: they
 * carry no ACL of their own, but their subjects legitimately see them — and,
 * through the resolver, their children, e.g. the VDIs of a resource set SR.
 *
 * @param {object} opts
 * @param {{ [objectId: string]: { [permission: string]: 1 } }} opts.permissionsByObject
 * @param {string[]} opts.resourceSetObjectIds
 * @returns {{ [objectId: string]: { [permission: string]: 1 } }}
 */
export function createPermissions({ permissionsByObject, resourceSetObjectIds }) {
  let permissions
  if (resourceSetObjectIds.length > 0) {
    permissions = { __proto__: null, ...permissionsByObject }
  } else {
    permissions = permissionsByObject
  }

  for (const objectId of resourceSetObjectIds) {
    permissions[objectId] = { ...permissions[objectId], view: 1 }
  }

  return permissions
}
