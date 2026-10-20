import * as CM from 'complex-matcher'
import { asyncEach } from '@vates/async-each'
import { featureUnauthorized, noSuchObject } from 'xo-common/api-errors.js'

/**
 * @typedef {import('@vates/types').XoApp} XoApp
 * @typedef {import('@vates/types').XoRecord} XoRecord
 * @typedef {import('complex-matcher').Node} CmNode
 * @typedef {import('complex-matcher').Resolver} CmResolver
 */

const getAnyObjectsConcurrency = 10

export default class ObjectResolver {
  /**
   * @param {XoApp} app
   */
  constructor(app) {
    this._app = app
  }

  /**
   * Synchronous resolver, limited to XAPI objects: they are the only ones held
   * in memory and therefore the only ones reachable without awaiting.
   *
   * @template {import('@vates/types').XapiXoRecord} Record
   * @param {Record['id']} id
   * @returns {Record | undefined} `undefined` when the id is unknown
   */
  xapiObjectResolver(id) {
    try {
      return this._app.getObject(id)
    } catch {
      return undefined
    }
  }

  /**
   * Build a resolver for a specific filter, by prefetching every object that
   * filter will dereference.
   *
   * complex-matcher cannot do this itself: `match()` is synchronous, because the
   * predicate it produces is handed to `Array#filter`. Yet only XAPI objects can
   * be read synchronously, every other record is fetched from a database by the
   * asynchronous `getAnyObject()`. So the awaiting is lifted out of matching and
   * done up front and what matching gets is a plain synchronous lookup.
   *
   * Resolution is walked level by level because a level's ids are only known
   * once the previous one has been fetched, and each id is fetched at most once
   * for the whole filter run.
   *
   * @param {XoRecord | XoRecord[]} objects the objects the filter will be matched against
   * @param {CmNode} filterNode
   * @returns {Promise<CmResolver>}
   */
  async buildResolver(objects, filterNode) {
    /** @type {XoRecord[]} */
    let objectArray
    if (!Array.isArray(objects)) {
      objectArray = [objects]
    } else {
      objectArray = objects
    }

    /** @type {Map<XoRecord['id'], XoRecord>} */
    const anyObjects = new Map()

    // ids which `getAnyObject()` could not resolve, remembered so that a filter
    // reaching the same dangling id from another branch does not walk the whole
    // getter chain again
    /** @type {Set<XoRecord['id']>} */
    const unresolvableIds = new Set()

    /**
     * @param {XoRecord[]} objectsToProcess
     * @param {CmNode} node
     * @returns {Promise<void>}
     */
    const process = async (objectsToProcess, node) => {
      const fields = CM.getResolveFields(node)

      for (const field of fields) {
        /** @type {Set<XoRecord['id']>} */
        const objectIds = new Set()
        for (const objectToProcess of objectsToProcess) {
          const ids = field.path.reduce((object, path) => object?.[path], objectToProcess)
          if (ids !== undefined) {
            for (const id of Array.isArray(ids) ? ids : [ids]) {
              objectIds.add(id)
            }
          }
        }

        await asyncEach(
          objectIds,
          async objectId => {
            if (!anyObjects.has(objectId) && !unresolvableIds.has(objectId)) {
              let fetchedObject
              try {
                fetchedObject = await this._app.getAnyObject(objectId)
              } catch (error) {
                if (!noSuchObject.is(error)) {
                  throw error
                }
              }

              if (fetchedObject !== undefined) {
                anyObjects.set(objectId, fetchedObject)
              } else {
                unresolvableIds.add(objectId)
              }
            }
          },
          { concurrency: getAnyObjectsConcurrency }
        )

        /** @type {XoRecord[]} */
        const resolvedObjects = []
        for (const objectId of objectIds) {
          const resolvedObject = anyObjects.get(objectId)
          if (resolvedObject !== undefined) {
            resolvedObjects.push(resolvedObject)
          }
        }

        if (resolvedObjects.length > 0) {
          await process(resolvedObjects, field.resolveNode.child)
        }
      }
    }

    await process(objectArray, filterNode)

    return id => anyObjects.get(id)
  }

  /**
   * Look an id up in every collection which can hold an `XoRecord`.
   *
   * Ordered by cost and parallelized where pertinent.
   *
   * @template {XoRecord} Record
   * @param {Record['id']} id
   * @returns {Promise<Record>}
   * @throws `noSuchObject` when no collection holds this id
   */
  async getAnyObject(id) {
    // We do getObject first because it covers all XAPI object
    try {
      return await this._app.getObject(id)
    } catch (error) {
      if (!noSuchObject.is(error)) {
        throw error
      }
    }

    // Then the cheap getters in parallel
    const parallelGetters = [
      () => this._app.getAclV2Privilege(id),
      () => this._app.getAclV2Role(id),
      () => this._app.getGroup(id),
      () => this._app.getJob(id),
      () => this._app.getProxy(id),
      () => this._app.getRemote(id),
      () => this._app.getSchedule(id),
      () => this._app.tasks.get(id),
      () => this._app.getUser(id, { obfuscatePassword: true }),
      () => this._app.getXenServer(id),
    ]

    const parallelPromises = parallelGetters.map(async getter => getter())
    try {
      return await new Promise((resolve, reject) => {
        let pending = parallelPromises.length
        const errors = []
        for (const promise of parallelPromises) {
          promise.then(resolve, error => {
            errors.push(error)
            if (--pending === 0) {
              reject(errors)
            }
          })
        }
      })
    } catch (errors) {
      for (const error of errors) {
        if (!noSuchObject.is(error) && !featureUnauthorized.is(error)) {
          throw error
        }
      }
    }

    // Then the more costly logs and archives
    for (const getter of [() => this._app.getVmBackupArchive(id), () => this._app.getBackupNgLogs(id)]) {
      try {
        return await getter()
      } catch (error) {
        if (!noSuchObject.is(error) && !featureUnauthorized.is(error)) {
          throw error
        }
      }
    }

    throw noSuchObject(id)
  }
}
