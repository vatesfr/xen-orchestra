import type { XapiXoRecord } from '@vates/types'

import type { XoApp } from './rest-api.type.mjs'
import type { Container } from 'inversify'

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

  getCurrentUser() {
    return this.#xoApp.apiContext.user
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

  getXapiObject<T extends XapiXoRecord>(maybeId: T['id'] | T, type: T['type']) {
    return this.#xoApp.getXapiObject<T>(maybeId, type)
  }

  runWithApiContext(...args: Parameters<XoApp['runWithApiContext']>) {
    return this.#xoApp.runWithApiContext(...args)
  }
}
