import { XapiXoRecord } from '@vates/types'

import type { XoApp } from './rest-api.type.mjs'

export class RestApi {
  #xoApp: XoApp

  constructor(xoApp: XoApp) {
    this.#xoApp = xoApp
  }

  get tasks() {
    return this.#xoApp.tasks
  }

  get xoApp() {
    return this.#xoApp
  }

  authenticateUser(...args: Parameters<XoApp['authenticateUser']>) {
    return this.#xoApp.authenticateUser(...args)
  }

  getObject<T extends XapiXoRecord>(id: T['id'], type: T['type']) {
    return this.#xoApp.getObject(id, type)
  }

  getObjectsByType<T extends XapiXoRecord>(type: T['type'], opts: Parameters<XoApp['getObjectsByType']>[1]) {
    return this.#xoApp.getObjectsByType(type, opts)
  }

  getXapiObject<T extends XapiXoRecord>(maybeId: T['id'] | T, type: T['type']) {
    return this.#xoApp.getXapiObject<T>(maybeId, type)
  }

  runWithApiContext(...args: Parameters<XoApp['runWithApiContext']>) {
    return this.#xoApp.runWithApiContext(...args)
  }
}
