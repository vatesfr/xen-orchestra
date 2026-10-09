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
 * Objects of a resource set are granted an implicit `view` permission: they
 * carry no ACL of their own, but their subjects legitimately see them — and,
 * through the resolver, their children, e.g. the VDIs of a resource set SR.
 *
 * The returned predicate memoizes its answers and must therefore not outlive
 * the batch of objects it was created for, as the object graph keeps moving.
 *
 * @param {object} opts
 * @param {(id: string) => object | undefined} opts.getObject
 * @param {{ [objectId: string]: { [permission: string]: 1 } }} opts.permissionsByObject
 * @param {string[]} [opts.resourceSetObjectIds]
 * @returns {IsObjectVisible}
 */
export function createIsObjectVisible({ getObject, permissionsByObject, resourceSetObjectIds = [] }) {
  let permissions
  if (resourceSetObjectIds.length > 0) {
    permissions = { __proto__: null, ...permissionsByObject }
  } else {
    permissions = permissionsByObject
  }

  const cache = new Map()

  for (const objectId of resourceSetObjectIds) {
    permissions[objectId] = { ...permissions[objectId], view: 1 }
  }

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
