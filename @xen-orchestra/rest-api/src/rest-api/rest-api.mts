import type { XapiXoRecordByType, XoApp } from './rest-api.type.mjs'

export class RestApi {
  #xoApp: XoApp

  constructor(xoApp: XoApp) {
    this.#xoApp = xoApp
  }

  authenticateUser(...args: Parameters<XoApp['authenticateUser']>) {
    return this.#xoApp.authenticateUser(...args)
  }

  getObject<T extends keyof XapiXoRecordByType>(id: XapiXoRecordByType[T]['id'], type: T) {
    return this.#xoApp.getObject(id, type)
  }

  getObjectsByType<T extends keyof XapiXoRecordByType>(type: T, opts: Parameters<XoApp['getObjectsByType']>[1]) {
    return this.#xoApp.getObjectsByType(type, opts)
  }

  runWithApiContext(...args: Parameters<XoApp['runWithApiContext']>) {
    return this.#xoApp.runWithApiContext(...args)
  }
}
