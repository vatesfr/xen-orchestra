import { createIsObjectVisible } from '../_objectVisibility.mjs'
import TTLCache from '@isaacs/ttlcache'
import isEqual from 'lodash/isEqual.js'
import { createLogger } from '@xen-orchestra/log'

const log = createLogger('xo:object-visibility')

/**
 * @typedef {{
 *   permission: string,
 *   permissionsByObject?: { [objectId: string]: { [permission: string]: 1 } },
 *   resourceSetObjectIds?: string[],
 * }} Sources
 */

/**
 * A missing side means there is nothing to compare against, so the caller must
 * treat it as changed and push rather than risk withholding.
 *
 * @param {Sources} [sourceA]
 * @param {Sources} [sourceB]
 * @returns {boolean}
 */
function sourcesAreEqual(sourceA, sourceB) {
  if (sourceA === undefined || sourceB === undefined) {
    return false
  }

  return (
    isEqual(sourceA.permissionsByObject, sourceB.permissionsByObject) &&
    isEqual(sourceA.resourceSetObjectIds, sourceB.resourceSetObjectIds)
  )
}

// ACLs are commonly written in loops — creating a VM in a resource set grants
// one per subject — and each write would otherwise resync every connected
// client. Pushes are collapsed over this window; the cache itself is always
// dropped immediately, so no stale permission is ever used.
const DELAY = 500

// key standing for "every user", since a blanket invalidation carries no id
const ALL_USERS = Symbol('all users')

export default class ObjectVisibility {
  constructor(app) {
    this._app = app
    app.hooks?.on('stop', () => {
      for (const { timer } of this.#pendingResyncs.values()) {
        clearTimeout(timer)
      }
    })
  }

  /**
   * The TTL is a safety net: should an invalidation path ever be missed, a
   * stale filter heals itself instead of lasting until the next restart.
   *
   * @type {TTLCache<string, Promise<Sources>>}
   */
  #sourcesByUserId = new TTLCache({ ttl: 5 * 60 * 1e3 })

  /**
   * Resyncs waiting for the debounce window to close, by user id (or
   * `ALL_USERS`).
   *
   * @type {Map<string | symbol, { timer: any, previousSources: Map<string, Promise<Sources>>, promise: Promise<void>, resolve: () => void }>}
   */
  #pendingResyncs = new Map()

  /**
   * Returns the predicate deciding which objects a user may see, or
   * `undefined` for an admin, which means no filtering at all.
   *
   * @param {string} userId
   * @returns {Promise<import('../_objectVisibility.mjs').IsObjectVisible | undefined>}
   */
  async getObjectFilterForUser(userId) {
    const { permission, permissionsByObject, resourceSetObjectIds } = await this.#getSources(userId)

    if (permission === 'admin') {
      return undefined
    } else {
      return createIsObjectVisible({
        getObject: objectId => {
          try {
            return this._app.getObject(objectId)
          } catch {
            return undefined
          }
        },
        permissionsByObject,
        resourceSetObjectIds,
      })
    }
  }

  /**
   * Drops the cached permissions of a user, or of every user when called
   * without argument, and pushes the objects that just became visible to the
   * connections concerned.
   *
   * The cache is dropped straight away: a revoked permission must never be
   * used again, whatever the push does afterwards. What the previous state was
   * is kept so the resync can tell whose permissions actually moved.
   *
   * @param {string} [userId]
   * @returns {Promise<void>} resolves once the connections have been resynced;
   *   callers may ignore it, it never rejects
   */
  async clearObjectFilterCache(userId = undefined) {
    const previousSources = new Map()

    const storeSourceInPrevious = userId => {
      const sources = this.#sourcesByUserId.get(userId)

      if (sources !== undefined) {
        previousSources.set(userId, sources)
      }
    }

    if (userId !== undefined) {
      storeSourceInPrevious(userId)
      this.#sourcesByUserId.delete(userId)
    } else {
      for (const userId of this.#sourcesByUserId.keys()) {
        storeSourceInPrevious(userId)
      }
      this.#sourcesByUserId.clear()
    }

    return this.#scheduleResync(userId, previousSources)
  }

  /**
   * The permission is read first and cached with the rest: this runs on the
   * notification path, and `getUser` is uncached, so an uncached lookup would
   * put Redis between every batch and its clients.
   *
   * @param {string} userId
   * @returns {Promise<Sources>}
   */
  async #computeSourcesForUser(userId) {
    const { permission } = await this._app.getUser(userId)

    if (permission === 'admin') {
      return { permission }
    } else {
      const [permissionsByObject, resourceSets] = await Promise.all([
        this._app.getPermissionsForUser(userId),
        this._app.getAllResourceSets(userId),
      ])
      const resourceSetObjectIds = resourceSets.flatMap(resourceSet => resourceSet.objects).sort()

      return { permission, permissionsByObject, resourceSetObjectIds }
    }
  }

  /**
   * The promise is cached rather than its result, so two callers arriving
   * together share one computation instead of both hitting Redis. A rejection
   * is never kept: a transient failure must not be served for the whole TTL.
   *
   * @param {string} userId
   * @returns {Promise<Sources>}
   */
  async #getSources(userId) {
    if (this.#sourcesByUserId.has(userId)) {
      return this.#sourcesByUserId.get(userId)
    } else {
      try {
        const sources = this.#computeSourcesForUser(userId)
        this.#sourcesByUserId.set(userId, sources)

        return await sources
      } catch (error) {
        this.#sourcesByUserId.delete(userId)

        throw error
      }
    }
  }

  /**
   * Defers the push, collapsing a burst of invalidations into a single resync.
   *
   * When a burst is merged, the earliest snapshot wins: the comparison must be
   * made against the state from before the burst began, not against the one
   * its own first invalidation left behind.
   *
   * @param {string} [userId]
   * @param {Map<string, Promise<Sources>>} previousSources
   * @returns {Promise<void>}
   */
  #scheduleResync(userId, previousSources) {
    const key = userId ?? ALL_USERS
    let entry = this.#pendingResyncs.get(key)

    if (entry === undefined) {
      let resolveResync
      const promise = new Promise(resolve => {
        resolveResync = resolve
      })

      entry = { previousSources, promise, resolve: resolveResync }
      this.#pendingResyncs.set(key, entry)
    } else {
      clearTimeout(entry.timer)

      for (const [id, sources] of previousSources) {
        if (!entry.previousSources.has(id)) {
          entry.previousSources.set(id, sources)
        }
      }
    }

    entry.timer = setTimeout(() => {
      this.#pendingResyncs.delete(key)
      this.#resyncObjects(userId, entry.previousSources)
        .catch(error => log.warn('failed to resync objects', { error, userId }))
        .then(entry.resolve)
    }, DELAY)

    return entry.promise
  }

  /**
   * Each connection is isolated: one unreadable user — a deleted account still
   * holding a socket, a Redis hiccup — must not stop the others from being
   * resynced.
   *
   * @param {string} [userId] - when given, only that user's connections
   * @param {Map<string, Promise<Sources>>} previousSources
   */
  async #resyncObjects(userId, previousSources) {
    for (const connection of this._app.apiConnections ?? []) {
      const connectionUserId = connection.get('user_id', undefined)

      if (
        connectionUserId === undefined ||
        connection.notify === undefined ||
        (userId !== undefined && connectionUserId !== userId)
      ) {
        continue
      }

      try {
        await this.#resyncConnection(connection, connectionUserId, previousSources)
      } catch (error) {
        log.warn('failed to resync a connection', { error, userId: connectionUserId })
      }
    }
  }

  /**
   * The event stream only carries changes, so a user granted access to an
   * object that already exists would not hear about it until they reload:
   * their whole visible set is pushed instead, and their client merges it.
   *
   * The opposite case needs nothing: xo-web keeps filtering client-side and
   * refreshes its permissions every 5s.
   *
   * @param {object} connection
   * @param {string} userId
   * @param {Map<string, Promise<Sources>>} previousSources
   */
  async #resyncConnection(connection, userId, previousSources) {
    const current = await this.#getSources(userId)
    const previous = await previousSources.get(userId)?.catch(() => undefined)

    // A client promoted to admin stops filtering locally, so it must be given
    // everything it was previously denied — otherwise it shows a near-empty XO
    // until the page is reloaded. An admin we have never filtered already has
    // everything and needs nothing.
    const promoted = current.permission === 'admin' && previous !== undefined && previous.permission !== 'admin'
    if (current.permission === 'admin' && !promoted) {
      return
    }

    // An ACL or resource set change invalidates every user, but concerns
    // almost none of them: without this, granting one ACL rebuilds and
    // re-sends the whole visible set of every connected client.
    if (!promoted && sourcesAreEqual(previous, current)) return

    const objects = this._app.objects.all
    const items = { __proto__: null }
    let isEmpty = true

    const isObjectVisible = promoted ? undefined : await this.getObjectFilterForUser(userId)
    for (const id in objects) {
      if (isObjectVisible === undefined || isObjectVisible(id)) {
        items[id] = objects[id]
        isEmpty = false
      }
    }

    if (!isEmpty) {
      connection.notify('all', { type: 'enter', items })
    }
  }
}
