import setupRestApi, { sendObjects } from '@xen-orchestra/rest-api'
import { invalidCredentials, unauthorized } from 'xo-common/api-errors.js'
import { json, Router } from 'express'
import path from 'node:path'

const { join } = path.posix

const subRouter = (app, path) => {
  const router = Router({ strict: false })
  app.use(path, router)
  return router
}

export default class RestApi {
  #app
  #api
  #mountExternalRoute

  constructor(app, { express }) {
    // don't set up the API if express is not present
    //
    // that can happen when the app is instantiated in another context like xo-server-recover-account
    if (express === undefined) {
      return
    }

    const api = subRouter(express, '/rest/v0')
    this.#api = api
    this.#app = app
    const { mountExternalRoute } = setupRestApi(express, app)
    this.#mountExternalRoute = mountExternalRoute
  }

  registerRestRoutes(routes, base = '/') {
    const unregisterFuncs = []
    routes.forEach(route => {
      route.endpoint = join(base, route.endpoint)
      unregisterFuncs.push(this.#mountExternalRoute(route))
    })

    return () => {
      for (const unregisterFunc of unregisterFuncs) {
        unregisterFunc()
      }
    }
  }

  /**
   * @deprecated use registerRestRoutes instead
   * @todo remove when not used anymore
   */
  registerRestApi(spec, base = '/') {
    const authUser = this.#authenticateUser.bind(this)
    const app = this.#app

    for (const path of Object.keys(spec)) {
      if (path[0] === '_') {
        const handler = spec[path]
        this.#api[path.slice(1)](base, json(), async function autoRegisteredHandler(req, res, next) {
          try {
            const user = await authUser(req)
            const result = await app.runWithApiContext(user, () => handler(req, res, next))

            if (result !== undefined) {
              const isIterable =
                result !== null && typeof (result[Symbol.iterator] ?? result[Symbol.asyncIterator]) === 'function'
              if (isIterable) {
                await sendObjects(result, req, res)
              } else {
                res.json(result)
              }
            }
          } catch (error) {
            next(error)
          }
        })
      } else {
        this.registerRestApi(spec[path], join(base, path))
      }
    }
    return () => {
      this.unregisterRestApi(spec, base)
    }
  }

  /**
   * @deprecated use registerRestRoutes instead
   * @todo remove when not used anymore
   */
  unregisterRestApi(spec, base = '/') {
    for (const path of Object.keys(spec)) {
      if (path[0] === '_') {
        const method = path.slice(1)
        let found = false
        // looping through the API routes backwards, as the auto-registered routes were probably added last
        for (let i = this.#api.stack.length - 1; i >= 0; i--) {
          const route = this.#api.stack[i].route
          // route.stack[0] is the json parser
          // checking the handler name for an extra safety we're not removing a hardcoded route
          if (
            route.path === base &&
            route.stack[1]?.method === method &&
            route.stack[1]?.handle?.name === 'autoRegisteredHandler'
          ) {
            this.#api.stack.splice(i, 1)
            found = true
            break
          }
        }
        if (!found) {
          console.warn('Route to unregister not found', base)
        }
      } else {
        this.unregisterRestApi(spec[path], join(base, path))
      }
    }
  }

  async #authenticateUser(req) {
    const { cookies, ip } = req
    const token = cookies.authenticationToken ?? cookies.token

    if (!token) {
      throw invalidCredentials()
    }

    const { user } = await this.#app.authenticateUser({ token }, { ip })

    if (user.permission !== 'admin') {
      throw unauthorized()
    }

    return user
  }
}
