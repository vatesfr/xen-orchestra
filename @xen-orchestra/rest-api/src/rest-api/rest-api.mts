import { createLogger } from '@xen-orchestra/log'
import { invalidCredentials } from 'xo-common/api-errors.js'
import type { XapiXoRecord, XoUser } from '@vates/types'

import type { XoApp } from './rest-api.type.mjs'
import type { Container } from 'inversify'

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
    opts?: { filter?: string | ((obj: T) => boolean); limit?: number }
  ) {
    return this.#xoApp.getObjectsByType(type, opts)
  }

  getXapiObject<T extends XapiXoRecord>(maybeId: T['id'] | T, type: T['type'] | T['type'][]) {
    return this.#xoApp.getXapiObject<T>(maybeId, type)
  }

  runWithApiContext(...args: Parameters<XoApp['runWithApiContext']>) {
    return this.#xoApp.runWithApiContext(...args)
  }
}
