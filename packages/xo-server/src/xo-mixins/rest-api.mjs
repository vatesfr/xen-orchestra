import { Router } from 'express'
import * as entities from '../rest-api/entities.mjs'

// @TODO:
// - implement middlewhare to retrieve user from a token
// - Do a non XAPI collection test (like users,dashboard, group, backups,...)
//  - maybe rename AbstractXapiCollection into AbstractCollection? (for users, groups, ...) to be able to extends it?
// - expose an action
// - handle sync an async actions
// - how to handle "/" and "/:uuid" with user permission
// - expose openapi + swagger docs

export default class RestApi {
  constructor(app, { express }) {
    // don't setup the API if express is not present
    //
    // that can happen when the app is instanciated in another context like xo-server-recover-account
    if (express === undefined) {
      return
    }

    const coreRouter = new Router()

    for (const entity in entities) {
      const instance = new entities[entity](app)
      instance.registerRouter(coreRouter)
    }

    express.use('/rest/v0', coreRouter)
  }

  registerRestApi() {
    //
  }
}
