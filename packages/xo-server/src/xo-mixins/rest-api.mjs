import setupRestApi from '@xen-orchestra/rest-api'
import { invalidCredentials, unauthorized } from 'xo-common/api-errors.js'
import { pipeline } from 'node:stream/promises'
import { json, Router } from 'express'
import path from 'node:path'
import pick from 'lodash/pick.js'

const { join } = path.posix

async function* mapIterable(iterable, mapper) {
  for await (const item of iterable) {
    yield mapper(item)
  }
}

async function* makeJsonStream(iterable) {
  yield '['
  let first = true
  for await (const object of iterable) {
    if (first) {
      first = false
      yield '\n'
    } else {
      yield ',\n'
    }
    yield JSON.stringify(object, null, 2)
  }
  yield '\n]\n'
}

async function* makeNdJsonStream(iterable) {
  for await (const object of iterable) {
    yield JSON.stringify(object)
    yield '\n'
  }
}

function makeObjectMapper(req, path = req.path) {
  const { query } = req

  const { baseUrl } = req
  const makeUrl =
    typeof path === 'function'
      ? object => join(baseUrl, path(object), typeof object.id === 'number' ? String(object.id) : object.id)
      : ({ id }) => join(baseUrl, path, typeof id === 'number' ? String(id) : id)

  let objectMapper
  let { fields } = query
  if (fields === undefined) {
    objectMapper = makeUrl
  } else if (fields === '*') {
    objectMapper = object => ({
      ...object,
      href: makeUrl(object),
    })
  } else {
    fields = fields.split(',')
    objectMapper = object => {
      const url = makeUrl(object)
      object = pick(object, fields)
      object.href = url
      return object
    }
  }

  return function (entry) {
    return objectMapper(typeof entry === 'string' ? { id: entry } : entry)
  }
}

async function sendObjects(iterable, req, res, mapper) {
  const json = !Object.hasOwn(req.query, 'ndjson')

  if (mapper !== null) {
    if (typeof mapper !== 'function') {
      mapper = makeObjectMapper(req, ...Array.prototype.slice.call(arguments, 3))
    }
    iterable = mapIterable(iterable, mapper)
  }

  res.setHeader('content-type', json ? 'application/json' : 'application/x-ndjson')
  return pipeline((json ? makeJsonStream : makeNdJsonStream)(iterable), res)
}

const subRouter = (app, path) => {
  const router = Router({ strict: false })
  app.use(path, router)
  return router
}

export default class RestApi {
  #app
  #api

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

    // register the route BEFORE the authentication middleware because this route does not require authentication
    api.post('/users/authentication_tokens', json(), async (req, res) => {
      const authorization = req.headers.authorization ?? ''
      const [, encodedCredentials] = authorization.split(' ')
      if (encodedCredentials === undefined) {
        return res.status(401).json('missing credentials')
      }

      const [username, password] = Buffer.from(encodedCredentials, 'base64').toString().split(':')

      try {
        const { user } = await app.authenticateUser({ username, password, otp: req.query.otp })
        const token = await app.createAuthenticationToken({
          client: req.body.client,
          userId: user.id,
          description: req.body.description,
          expiresIn: req.body.expiresIn,
        })
        res.json({ token })
      } catch (error) {
        if (invalidCredentials.is(error)) {
          res.status(401)
        } else {
          res.status(400)
        }
        res.json(error.message)
      }
    })

    setupRestApi(express, app)
  }

  async #authenticateUser(req) {
    const app = this.#app
    const { cookies, ip } = req

    const token = cookies.authenticationToken ?? cookies.token
    if (token === undefined) {
      throw invalidCredentials()
    }

    const { user } = await app.authenticateUser({ token }, { ip })
    if (user.permission !== 'admin') {
      throw unauthorized()
    }

    return user
  }

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
}
