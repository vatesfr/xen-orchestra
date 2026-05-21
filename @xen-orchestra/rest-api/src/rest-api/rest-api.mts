import { createLogger } from '@xen-orchestra/log'
import { invalidCredentials } from 'xo-common/api-errors.js'
import type { XapiXoRecord, XoApp, XoUser } from '@vates/types'

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

  getObjectsByType<T extends XapiXoRecord>(
    type: T['type'],
    { filter, ...opts }: { filter?: string | ((obj: T) => boolean); limit?: number } = {}
  ): Record<T['id'], T> {
    if (filter !== undefined && typeof filter === 'string') {
      filter = safeParseComplexMatcher(filter).createPredicate()
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
