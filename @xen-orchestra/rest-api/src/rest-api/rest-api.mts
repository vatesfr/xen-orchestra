import type { XapiXoRecordByType, XoApp } from './rest-api.type.mjs'

export class RestApi {
  #xoApp: XoApp

  constructor(xoApp: XoApp) {
    this.#xoApp = xoApp
  }

  authenticateUser(...args: Parameters<XoApp['authenticateUser']>) {
    return this.#xoApp.authenticateUser(...args)
  }

  getObject(id, type) {
    return this.#xoApp.getObject(id, type)
  }

  getObjectsByType() {
    return this.getObjectsByType()
  }

  runWithApiContext(...args: Parameters<XoApp['runWithApiContext']>) {
    return this.#xoApp.runWithApiContext(...args)
  }
}
