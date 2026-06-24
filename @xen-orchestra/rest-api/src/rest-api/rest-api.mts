import { createLogger } from '@xen-orchestra/log'
import { invalidCredentials } from 'xo-common/api-errors.js'
import type { XapiXoRecord, XoApp, XoUser } from '@vates/types'
import * as CM from 'complex-matcher'

import type { Container } from 'inversify'
import { safeParseComplexMatcher } from '../helpers/utils.helper.mjs'

const log = createLogger('xo:rest-api:error-handler')

export class RestApi {
  #ioc: Container
  #xoApp: XoApp

  constructor(xoApp: XoApp, iocContainer: Container) {
    this.#xoApp = xoApp
    this.#ioc = iocContainer
  }

  get tasks() {
    return this.#xoApp.tasks
  }

  get xoApp() {
    return this.#xoApp
  }

  get ioc() {
    return this.#ioc
  }

  authenticateUser(...args: Parameters<XoApp['authenticateUser']>) {
    return this.#xoApp.authenticateUser(...args)
  }

  getCurrentUser(opts?: { throwUnauthenticated?: true }): XoUser
  getCurrentUser(opts: { throwUnauthenticated: false }): undefined | XoUser
  getCurrentUser(opts?: { throwUnauthenticated?: boolean }): undefined | XoUser
  getCurrentUser({ throwUnauthenticated = true }: { throwUnauthenticated?: boolean } = {}): undefined | XoUser {
    const user = this.#xoApp.apiContext.user

    if (user === undefined && throwUnauthenticated) {
      log.error('getCurrentUser received an unauthenticated API call')
      throw invalidCredentials()
    }

    return user
  }

  getObject<T extends XapiXoRecord>(id: T['id'], type?: T['type'] | T['type'][]) {
    return this.#xoApp.getObject(id, type)
  }

  resolver = (id: string): object | undefined => {
    try {
      return this.#xoApp.getObject(id as XapiXoRecord['id'])
    } catch {
      return undefined
    }
  }

  async buildResolver(objects: object | object[], filterNode: CM.Node): Promise<(id: string) => object | undefined> {
    let objectArray: object[]
    if (!Array.isArray(objects)) {
      objectArray = [objects]
    } else {
      objectArray = objects
    }

    const anyObjects: Map<string, object> = new Map()
    const process = async (objectsToProcess: object[], node: CM.Node) => {
      const fields = CM.getResolveFields(node)

      for (const field of fields) {
        const objectIds: string[] = []
        for (const object of objectsToProcess) {
          const ids = object[field.name]
          if (ids !== undefined) {
            for (const id of Array.isArray(ids) ? ids : [ids]) {
              if (!anyObjects.has(id) && !objectIds.includes(id)) {
                objectIds.push(id)
              }
            }
          }
        }

        const fetchedObjects: object[] = []
        for (const objectId of objectIds) {
          const fetchedObject = await this.#xoApp.getAnyObject(objectId)
          if (fetchedObject !== undefined) {
            anyObjects.set(objectId, fetchedObject)
            fetchedObjects.push(fetchedObject)
          }
        }

        if (fetchedObjects.length > 0) {
          await process(fetchedObjects, field.resolveNode.child)
        }
      }
    }

    await process(objectArray, filterNode)

    return (id: string) => anyObjects.get(id) ?? this.resolver(id)
  }

  getObjectsByType<T extends XapiXoRecord>(
    type: T['type'],
    { filter, ...opts }: { filter?: string | ((obj: T) => boolean); limit?: number } = {}
  ): Record<T['id'], T> {
    if (filter !== undefined && typeof filter === 'string') {
      filter = safeParseComplexMatcher(filter).createPredicate(this.resolver)
    }
    return this.#xoApp.getObjectsByType(type, { filter, ...opts }) ?? ({} as Record<T['id'], T>)
  }

  getXapiObject<T extends XapiXoRecord>(maybeId: T['id'] | T, type: T['type'] | T['type'][]) {
    return this.#xoApp.getXapiObject<T>(maybeId, type)
  }

  runWithApiContext(...args: Parameters<XoApp['runWithApiContext']>) {
    return this.#xoApp.runWithApiContext(...args)
  }
}
