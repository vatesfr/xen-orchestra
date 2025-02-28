import { XapiXoRecord } from '@vates/types'

import type { XoApp } from './rest-api.type.mjs'

export class RestApi {
  #xoApp: XoApp

  constructor(xoApp: XoApp) {
    this.#xoApp = xoApp
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

  runWithApiContext(...args: Parameters<XoApp['runWithApiContext']>) {
    return this.#xoApp.runWithApiContext(...args)
  }
}
