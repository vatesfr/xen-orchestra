import type { XoApp } from './rest-api.type.mjs'

export class RestApi {
  authenticateUser: XoApp['authenticateUser']
  runWithApiContext: XoApp['runWithApiContext']

  constructor(xoApp: XoApp) {
    this.authenticateUser = (credentials, userData, opts) => xoApp.authenticateUser(credentials, userData, opts)
    this.runWithApiContext = (user, cb) => xoApp.runWithApiContext(user, cb)
  }
}
