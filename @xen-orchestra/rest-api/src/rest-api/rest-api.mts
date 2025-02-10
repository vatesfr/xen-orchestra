import type { XoApp } from './rest-api.type.mjs'

export class RestApi {
  authenticateUser: XoApp['authenticateUser']
  runWithApiContext: XoApp['runWithApiContext']

  constructor(xoApp: XoApp) {
    this.authenticateUser = (params, optional) => xoApp.authenticateUser(params, optional)
    this.runWithApiContext = (user, cb) => xoApp.runWithApiContext(user, cb)
  }
}
