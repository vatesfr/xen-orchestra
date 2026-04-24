import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { AsyncLocalStorage } from 'node:async_hooks'
import { createServer } from 'node:http'
import express from 'express'
import cookieParser from 'cookie-parser'
import { configure } from '@xen-orchestra/log/configure'
import { invalidCredentials, unauthorized } from 'xo-common/api-errors.js'
import RestApi from './rest-api.mjs'

configure({ level: 'FATAL', transport: () => {} })

// Minimal tasks mock - records every create() call for inspection in tests
const createMockTasks = () => {
  const calls = []
  return {
    calls,
    create(properties) {
      const id = `task-${calls.length}`
      calls.push({ id, properties: { ...properties } })
      return { id, run: fn => Promise.resolve().then(() => fn({ id })) }
    },
  }
}

// Minimal XoApp mock
const createMockXoApp = ({ validToken = 'valid-token', permission = 'admin', tasks } = {}) => {
  const storage = new AsyncLocalStorage()
  return {
    get apiContext() {
      return storage.getStore() ?? {}
    },
    authenticateUser: async ({ token, username, password }) => {
      if (token !== undefined) {
        if (token !== validToken) throw invalidCredentials()
      } else if (!(username === 'test-user' && password === 'test-pass')) {
        throw invalidCredentials()
      }
      return { user: { id: 'test-user', permission } }
    },
    runWithApiContext: (user, fn) => storage.run({ user }, fn),
    tasks: tasks ?? createMockTasks(),
  }
}

// Boots a real Express app with RestApi mounted
const createTestServer = async (xoApp = createMockXoApp()) => {
  const app = express()
  app.use(cookieParser())

  const restApi = new RestApi(xoApp, { express: app })

  // Minimal error handler so next(error) produces a readable JSON response
  app.use((err, _req, res, _next) => {
    let status = err.statusCode ?? 500
    if (invalidCredentials.is(err)) status = 401
    else if (unauthorized.is(err)) status = 403
    res.status(status).json({ error: err.message, code: err.code })
  })

  const server = createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()

  return { restApi, port, server, xoApp }
}

// GET /rest/v0/<path>
// - default: cookie auth with valid-token
// - { token: null }: no auth
// - { token: 'x' }: cookie auth with specific token
// - { username, password }: Basic auth (skips cookie)
const get = (port, path, { token = 'valid-token', username, password } = {}) => {
  const headers = {}
  if (username !== undefined) {
    headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
  } else if (token !== null) {
    headers.Cookie = `token=${token}`
  }
  return fetch(`http://127.0.0.1:${port}/rest/v0${path}`, { headers })
}

// POST /rest/v0/<path>
// - default: cookie auth, JSON body (auto-serialized)
// - { contentType }: custom Content-Type, body passed through as-is
const post = (port, path, { token = 'valid-token', body, contentType } = {}) => {
  const headers = token !== null ? { Cookie: `token=${token}` } : {}
  let serializedBody
  if (body !== undefined) {
    if (contentType !== undefined) {
      headers['Content-Type'] = contentType
      serializedBody = body
    } else {
      headers['Content-Type'] = 'application/json'
      serializedBody = JSON.stringify(body)
    }
  }
  return fetch(`http://127.0.0.1:${port}/rest/v0${path}`, { method: 'POST', headers, body: serializedBody })
}

// GET /rest/v0/docs/swagger.json (no auth required)
const fetchSwagger = port => fetch(`http://127.0.0.1:${port}/rest/v0/docs/swagger.json`)

describe('RestApi', () => {
  // TODO: Remove when registerRestApi is not used anymore
  describe('registerRestApi() (legacy)', () => {
    let server, restApi, port

    before(async () => {
      ;({ server, restApi, port } = await createTestServer())
    })

    after(() => new Promise((resolve, reject) => server.close(err => (err ? reject(err) : resolve()))))

    describe('authentication', () => {
      before(() => {
        restApi.registerRestApi(
          {
            _get: async () => ({}),
          },
          '/auth-test'
        )
      })

      it('rejects request with no token', async () => {
        const response = await get(port, '/auth-test', { token: null })
        assert.equal(response.status, 401)
      })

      it('rejects request with invalid token', async () => {
        const response = await get(port, '/auth-test', { token: 'bad-token' })
        assert.equal(response.status, 401)
      })

      it('rejects non-admin user', async () => {
        const { server, restApi, port } = await createTestServer(createMockXoApp({ permission: 'user' }))
        try {
          restApi.registerRestApi({ _get: async () => ({}) }, '/auth-test')
          const response = await get(port, '/auth-test')
          assert.equal(response.status, 403)
        } finally {
          await new Promise((resolve, reject) => server.close(err => (err ? reject(err) : resolve())))
        }
      })
    })

    describe('request data', () => {
      it('passes route params to handler', async () => {
        restApi.registerRestApi(
          {
            ':id': {
              _get: async req => ({ id: req.params.id }),
            },
          },
          '/params-test'
        )

        const response = await get(port, '/params-test/hello-123')
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { id: 'hello-123' })
      })

      it('passes query params to handler', async () => {
        restApi.registerRestApi(
          {
            'query-test': {
              _get: async req => ({ q: req.query.q }),
            },
          },
          '/test-data'
        )

        const response = await get(port, '/test-data/query-test?q=hello')
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { q: 'hello' })
      })

      it('passes request body to handler', async () => {
        restApi.registerRestApi(
          {
            'body-test': {
              _post: async req => ({ received: req.body }),
            },
          },
          '/test-data'
        )

        const response = await post(port, '/test-data/body-test', { body: { hello: 'world' } })
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { received: { hello: 'world' } })
      })
    })

    describe('routing', () => {
      it('resolves nested paths', async () => {
        restApi.registerRestApi(
          {
            a: {
              b: {
                _get: async () => ({ nested: true }),
              },
            },
          },
          '/nest-test'
        )

        const response = await get(port, '/nest-test/a/b')
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { nested: true })
      })

      it('registers multiple HTTP methods on the same path', async () => {
        restApi.registerRestApi(
          {
            multi: {
              _get: async () => ({ method: 'get' }),
              _post: async () => ({ method: 'post' }),
            },
          },
          '/multi-test'
        )

        const getResp = await get(port, '/multi-test/multi')
        assert.equal(getResp.status, 200)
        assert.deepEqual(await getResp.json(), { method: 'get' })

        const postResp = await post(port, '/multi-test/multi')
        assert.equal(postResp.status, 200)
        assert.deepEqual(await postResp.json(), { method: 'post' })
      })
    })

    describe('response handling', () => {
      it('returns JSON for object result', async () => {
        const routeReturn = { id: 'test', value: 67 }
        restApi.registerRestApi({ 'json-test': { _get: async () => routeReturn } }, '/')

        const response = await get(port, '/json-test')
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), routeReturn)
      })

      it('does not interfere when handler sends its own response', async () => {
        restApi.registerRestApi(
          {
            'void-test': {
              _get: async (_req, res) => res.status(204).end(),
            },
          },
          '/'
        )

        const response = await get(port, '/void-test')
        assert.equal(response.status, 204)
      })

      it('streams iterable result as JSON array', async () => {
        restApi.registerRestApi(
          {
            'iter-test': {
              _get: async () => [{ id: 'foo' }, { id: 'bar' }],
            },
          },
          '/'
        )

        const response = await get(port, '/iter-test?fields=*')
        assert.equal(response.status, 200)
        assert.ok(response.headers.get('content-type').includes('application/json'))
        const body = await response.json()
        assert.ok(Array.isArray(body))
        assert.equal(body.length, 2)
        assert.equal(body[0].id, 'foo')
        assert.equal(body[1].id, 'bar')
      })

      it('sends Buffer as JSON, not as a stream', async () => {
        restApi.registerRestApi(
          {
            'buffer-test': {
              _get: async () => Buffer.from(JSON.stringify({ ok: true })),
            },
          },
          '/'
        )

        const response = await get(port, '/buffer-test')
        assert.equal(response.status, 200)
        const body = await response.json()
        assert.equal(body.type, 'Buffer')
        assert.ok(Array.isArray(body.data))
      })

      it('passes handler errors to error middleware', async () => {
        restApi.registerRestApi(
          {
            'error-test': {
              _get: async () => {
                throw new Error('handler error')
              },
            },
          },
          '/'
        )

        const response = await get(port, '/error-test')
        assert.equal(response.status, 500)
        assert.equal((await response.json()).error, 'handler error')
      })
    })

    describe('unregistration', () => {
      it('cleanup function removes the route', async () => {
        const unregister = restApi.registerRestApi(
          {
            'unreg-test': {
              _get: async () => ({ ok: true }),
            },
          },
          '/'
        )

        const initialResponse = await get(port, '/unreg-test')
        assert.equal(initialResponse.status, 200)

        unregister()

        const finalResponse = await get(port, '/unreg-test')
        assert.equal(finalResponse.status, 404)
      })
    })
  })

  describe('registerRestRoutes()', () => {
    let server, restApi, port, mainXoApp

    before(async () => {
      ;({ server, restApi, port, xoApp: mainXoApp } = await createTestServer())
    })

    after(() => new Promise((resolve, reject) => server.close(err => (err ? reject(err) : resolve()))))

    describe('authentication', () => {
      before(() => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/',
              method: 'get',
              callback: () => ({}),
            },
          ],
          '/auth-test-rr'
        )
      })

      it('rejects request with no token', async () => {
        const response = await get(port, '/auth-test-rr', { token: null })
        assert.equal(response.status, 401)
      })

      it('rejects request with invalid token', async () => {
        const response = await get(port, '/auth-test-rr', { token: 'bad-token' })
        assert.equal(response.status, 401)
      })

      it('rejects non-admin user', async () => {
        let { server, restApi, port } = await createTestServer(createMockXoApp({ permission: 'user' }))
        try {
          restApi.registerRestRoutes(
            [
              {
                endpoint: '/',
                method: 'get',
                callback: () => ({}),
              },
            ],
            '/auth-test-rr'
          )
          const response = await get(port, '/auth-test-rr')
          assert.equal(response.status, 403)
        } finally {
          await new Promise((resolve, reject) => server.close(err => (err ? reject(err) : resolve())))
          // The IoC container is a global singleton; creating a temp RestApi restores its binding to mainXoApp
          restApi = new RestApi(mainXoApp, { express: express() })
        }
      })
    })

    describe('request data', () => {
      it('passes route params to handler', async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/{id}',
              method: 'get',
              callback: ({ req }) => ({ id: req.params.id }),
            },
          ],
          '/params-test-rr'
        )

        const response = await get(port, '/params-test-rr/hello-123')
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { id: 'hello-123' })
      })

      it('passes query params to handler', async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/query-test',
              method: 'get',
              callback: ({ req }) => ({ q: req.query.q }),
            },
          ],
          '/test-data-rr'
        )

        const response = await get(port, '/test-data-rr/query-test?q=hello')
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { q: 'hello' })
      })

      it('passes request body to handler', async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/body-test',
              method: 'post',
              middlewares: [{ name: 'json' }],
              callback: ({ req }) => ({ received: req.body }),
            },
          ],
          '/test-data-rr'
        )

        const response = await post(port, '/test-data-rr/body-test', { body: { hello: 'world' } })
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { received: { hello: 'world' } })
      })
    })

    describe('routing', () => {
      it('resolves nested paths', async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/a/b',
              method: 'get',
              callback: () => ({ nested: true }),
            },
          ],
          '/nest-test-rr'
        )

        const response = await get(port, '/nest-test-rr/a/b')
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { nested: true })
      })

      it('registers multiple HTTP methods on the same path', async () => {
        restApi.registerRestRoutes(
          [
            { endpoint: '/multi', method: 'get', callback: () => ({ method: 'get' }) },
            { endpoint: '/multi', method: 'post', callback: () => ({ method: 'post' }) },
          ],
          '/multi-test-rr'
        )

        const getResp = await get(port, '/multi-test-rr/multi')
        assert.equal(getResp.status, 200)
        assert.deepEqual(await getResp.json(), { method: 'get' })

        const postResp = await post(port, '/multi-test-rr/multi')
        assert.equal(postResp.status, 200)
        assert.deepEqual(await postResp.json(), { method: 'post' })
      })
    })

    describe('response handling', () => {
      it('returns JSON for object result', async () => {
        const routeReturn = { id: 'test', value: 67 }
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/json-test-rr',
              method: 'get',
              callback: () => routeReturn,
            },
          ],
          '/'
        )

        const response = await get(port, '/json-test-rr')
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), routeReturn)
      })

      it('returns 204 when callback returns undefined', async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/undefined-test-rr',
              method: 'get',
              callback: () => undefined,
            },
          ],
          '/'
        )

        const response = await get(port, '/undefined-test-rr')
        assert.equal(response.status, 204)
      })

      it('does not interfere when handler sends its own response', async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/void-test-rr',
              method: 'get',
              callback: ({ res }) => res.status(204).end(),
            },
          ],
          '/'
        )

        const response = await get(port, '/void-test-rr')
        assert.equal(response.status, 204)
      })

      it('streams iterable result as JSON array', async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/iter-test-rr',
              method: 'get',
              callback: () => [{ id: 'foo' }, { id: 'bar' }],
            },
          ],
          '/'
        )

        const response = await get(port, '/iter-test-rr')
        assert.equal(response.status, 200)
        assert.ok(response.headers.get('content-type').includes('application/json'))
        const body = await response.json()
        assert.ok(Array.isArray(body))
        assert.equal(body.length, 2)
        assert.equal(body[0].id, 'foo')
        assert.equal(body[1].id, 'bar')
      })

      it('sends Buffer as JSON, not as a stream', async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/buffer-test-rr',
              method: 'get',
              callback: () => Buffer.from(JSON.stringify({ ok: true })),
            },
          ],
          '/'
        )

        const response = await get(port, '/buffer-test-rr')
        assert.equal(response.status, 200)
        const body = await response.json()
        assert.equal(body.type, 'Buffer')
        assert.ok(Array.isArray(body.data))
      })

      it('passes handler errors to error middleware', async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/error-test-rr',
              method: 'get',
              callback: () => {
                throw new Error('handler error')
              },
            },
          ],
          '/'
        )

        const response = await get(port, '/error-test-rr')
        assert.equal(response.status, 500)
        assert.equal((await response.json()).error, 'handler error')
      })
    })

    describe('unregistration', () => {
      it('cleanup function removes the route', async () => {
        const unregister = restApi.registerRestRoutes(
          [
            {
              endpoint: '/unreg-test-rr',
              method: 'get',
              callback: () => ({ ok: true }),
            },
          ],
          '/'
        )

        const initialResponse = await get(port, '/unreg-test-rr')
        assert.equal(initialResponse.status, 200)

        unregister()

        const finalResponse = await get(port, '/unreg-test-rr')
        assert.equal(finalResponse.status, 404)
      })
    })

    describe('input validation', () => {
      before(() => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/param-validation/{type}',
              method: 'get',
              params: {
                type: {
                  type: 'enum',
                  enum: ['foo', 'bar'],
                },
              },
              callback: ({ req }) => ({ type: req.params.type }),
            },
            {
              endpoint: '/query-required-validation',
              method: 'get',
              query: {
                name: {
                  type: 'string',
                },
              },
              callback: ({ req }) => ({ name: req.query.name }),
            },
            {
              endpoint: '/bool-coerce-validation',
              method: 'get',
              query: {
                flag: {
                  type: 'boolean',
                },
              },
              callback: ({ req }) => ({ flag: req.query.flag }),
            },
            {
              endpoint: '/body-validation',
              method: 'post',
              middlewares: [
                {
                  name: 'json',
                },
              ],
              body: {
                name: {
                  type: 'string',
                },
              },
              callback: ({ req }) => ({ name: req.body.name }),
            },
          ],
          ''
        )
      })

      it('accepts valid route param (enum)', async () => {
        const response = await get(port, '/param-validation/foo')
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { type: 'foo' })
      })

      it('rejects invalid route param (enum)', async () => {
        const response = await get(port, '/param-validation/baz')
        assert.equal(response.status, 422)
      })

      it('accepts valid required query param', async () => {
        const response = await get(port, '/query-required-validation?name=hello')
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { name: 'hello' })
      })

      it('rejects missing required query param', async () => {
        const response = await get(port, '/query-required-validation')
        assert.equal(response.status, 422)
      })

      it('coerces boolean query param from string', async () => {
        const response = await get(port, '/bool-coerce-validation?flag=true')
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { flag: true })
      })

      it('accepts valid body', async () => {
        const response = await post(port, '/body-validation', { body: { name: 'hello' } })
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { name: 'hello' })
      })

      it('rejects invalid body type', async () => {
        const response = await post(port, '/body-validation', { body: { name: 123 } })
        assert.equal(response.status, 422)
      })

      it('rejects missing required body field', async () => {
        const response = await post(port, '/body-validation', { body: {} })
        assert.equal(response.status, 422)
      })
    })

    describe('middlewares', () => {
      it('urlencoded middleware parses form data', async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/',
              method: 'post',
              middlewares: [
                {
                  name: 'urlencoded',
                  options: {
                    extended: false,
                  },
                },
              ],
              callback: ({ req }) => ({ data: req.body.data }),
            },
          ],
          '/urlencoded-middleware-test'
        )
        const response = await post(port, '/urlencoded-middleware-test', {
          body: new URLSearchParams({ data: 'hello' }),
          contentType: 'application/x-www-form-urlencoded',
        })
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { data: 'hello' })
      })

      it('text middleware parses plain text', async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/',
              method: 'post',
              middlewares: [
                {
                  name: 'text',
                },
              ],
              callback: ({ req }) => ({ text: req.body }),
            },
          ],
          '/text-middleware-test'
        )
        const response = await post(port, '/text-middleware-test', {
          body: 'hello world',
          contentType: 'text/plain',
        })
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { text: 'hello world' })
      })

      it('raw middleware receives Buffer', async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/',
              method: 'post',
              middlewares: [
                {
                  name: 'raw',
                },
              ],
              callback: ({ req }) => ({ isBuffer: Buffer.isBuffer(req.body), length: req.body.length }),
            },
          ],
          '/raw-middleware-test'
        )
        const response = await post(port, '/raw-middleware-test', {
          body: Buffer.from([1, 2, 3]),
          contentType: 'application/octet-stream',
        })
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { isBuffer: true, length: 3 })
      })
    })

    describe('security', () => {
      it("security: 'none' allows unauthenticated requests", async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/no-auth-test',
              method: 'get',
              security: 'none',
              callback: () => ({ ok: true }),
            },
          ],
          '/'
        )
        const response = await get(port, '/no-auth-test', { token: null })
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { ok: true })
      })

      it("security: 'token' rejects basic auth credentials", async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/token-only-test',
              method: 'get',
              security: 'token',
              callback: () => ({ ok: true }),
            },
          ],
          '/'
        )
        const response = await get(port, '/token-only-test', { username: 'test-user', password: 'test-pass' })
        assert.equal(response.status, 401)
      })

      it("security: 'basic' accepts valid basic auth credentials", async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/basic-happy-test',
              method: 'get',
              security: 'basic',
              callback: () => ({ ok: true }),
            },
          ],
          '/'
        )
        const response = await get(port, '/basic-happy-test', { username: 'test-user', password: 'test-pass' })
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { ok: true })
      })

      it("security: 'basic' rejects token authentication", async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/basic-only-test',
              method: 'get',
              security: 'basic',
              callback: () => ({ ok: true }),
            },
          ],
          '/'
        )
        const response = await get(port, '/basic-only-test')
        assert.equal(response.status, 401)
      })
    })

    describe('actions', () => {
      before(() => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/action-async',
              method: 'post',
              callback: ({ createAction }) =>
                createAction(
                  () => {
                    return { done: true }
                  },
                  {
                    taskProperties: {
                      name: 'async action',
                      extra: 'data',
                    },
                  }
                ),
            },
            {
              endpoint: '/action-async-error',
              method: 'post',
              callback: ({ createAction }) =>
                createAction(
                  () => {
                    throw new Error('action failed')
                  },
                  {
                    taskProperties: {
                      name: 'failing action',
                    },
                  }
                ),
            },
            {
              endpoint: '/action-sync',
              method: 'post',
              callback: ({ createAction }) =>
                createAction(
                  () => {
                    return { done: true }
                  },
                  {
                    sync: true,
                    taskProperties: {
                      name: 'sync action',
                    },
                  }
                ),
            },
            {
              endpoint: '/action-sync-undefined',
              method: 'post',
              callback: ({ createAction }) =>
                createAction(
                  () => {
                    return undefined
                  },
                  {
                    sync: true,
                    taskProperties: {
                      name: 'undefined action',
                    },
                  }
                ),
            },
            {
              endpoint: '/action-sync-status',
              method: 'post',
              callback: ({ createAction }) =>
                createAction(
                  () => {
                    return { created: true }
                  },
                  {
                    sync: true,
                    statusCode: 201,
                    taskProperties: {
                      name: 'created action',
                    },
                  }
                ),
            },
            {
              endpoint: '/action-sync-error',
              method: 'post',
              callback: ({ createAction }) =>
                createAction(
                  () => {
                    throw new Error('sync action failed')
                  },
                  {
                    sync: true,
                    taskProperties: {
                      name: 'sync error action',
                    },
                  }
                ),
            },
          ],
          '/'
        )
      })

      it('async: responds 202 with taskId and Location header', async () => {
        const response = await post(port, '/action-async')
        assert.equal(response.status, 202)
        const body = await response.json()
        assert.ok(typeof body.taskId === 'string')
        assert.ok(response.headers.get('location')?.endsWith(`/tasks/${body.taskId}`))
      })

      it('async: silently catches action errors', async () => {
        const response = await post(port, '/action-async-error')
        assert.equal(response.status, 202)
        const body = await response.json()
        assert.ok(typeof body.taskId === 'string')
      })

      it('sync: awaits action and returns result as JSON with 200', async () => {
        const response = await post(port, '/action-sync')
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { done: true })
      })

      it('sync: returns 204 when action returns undefined', async () => {
        const response = await post(port, '/action-sync-undefined')
        assert.equal(response.status, 204)
      })

      it('sync: uses provided statusCode', async () => {
        const response = await post(port, '/action-sync-status')
        assert.equal(response.status, 201)
      })

      it('sync: propagates action errors to error middleware', async () => {
        const response = await post(port, '/action-sync-error')
        assert.equal(response.status, 500)
        assert.equal((await response.json()).error, 'sync action failed')
      })

      it('prepends "REST API: " to task name', async () => {
        const start = mainXoApp.tasks.calls.length
        await post(port, '/action-async')
        assert.equal(mainXoApp.tasks.calls[start].properties.name, 'REST API: async action')
      })

      it('sets task type to "xo:rest-api:action"', async () => {
        const start = mainXoApp.tasks.calls.length
        await post(port, '/action-async')
        assert.equal(mainXoApp.tasks.calls[start].properties.type, 'xo:rest-api:action')
      })

      it('passes extra taskProperties to task.create', async () => {
        const start = mainXoApp.tasks.calls.length
        await post(port, '/action-async')
        assert.equal(mainXoApp.tasks.calls[start].properties.extra, 'data')
      })
    })

    describe('swagger documentation', () => {
      it('registers route in swagger spec', async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/swagger-register-test',
              method: 'get',
              callback: () => ({}),
            },
          ],
          '/'
        )
        const spec = await (await fetchSwagger(port)).json()
        assert.ok('/swagger-register-test' in spec.paths)
      })

      it('unregistered route disappears from swagger spec', async () => {
        const unregister = restApi.registerRestRoutes(
          [
            {
              endpoint: '/swagger-disappear-test',
              method: 'get',
              callback: () => ({}),
            },
          ],
          '/'
        )
        unregister()
        const spec = await (await fetchSwagger(port)).json()
        assert.ok(!('/swagger-disappear-test' in spec.paths))
      })

      it('route params appear in swagger spec', async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/swagger-path-params/{id}',
              method: 'get',
              params: {
                id: {
                  type: 'string',
                },
              },
              callback: ({ req }) => ({ id: req.params.id }),
            },
          ],
          '/'
        )
        const spec = await (await fetchSwagger(port)).json()
        const pathEntry = spec.paths['/swagger-path-params/{id}']
        assert.ok(pathEntry !== undefined)
        assert.ok(pathEntry.get.parameters.some(p => p.name === 'id' && p.in === 'path'))
      })

      it('query params appear in swagger spec', async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/swagger-query-params',
              method: 'get',
              query: {
                search: {
                  type: 'string',
                },
              },
              callback: () => ({}),
            },
          ],
          '/'
        )
        const spec = await (await fetchSwagger(port)).json()
        const pathEntry = spec.paths['/swagger-query-params']
        assert.ok(pathEntry !== undefined)
        assert.ok(pathEntry.get.parameters.some(p => p.name === 'search' && p.in === 'query'))
      })

      it('body fields appear in swagger spec', async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/swagger-body-fields',
              method: 'post',
              middlewares: [
                {
                  name: 'json',
                },
              ],
              body: {
                title: {
                  type: 'string',
                },
              },
              callback: () => ({}),
            },
          ],
          '/'
        )
        const spec = await (await fetchSwagger(port)).json()
        const pathEntry = spec.paths['/swagger-body-fields']
        assert.ok(pathEntry !== undefined)
        assert.ok(pathEntry.post.requestBody?.content?.['application/json'] !== undefined)
      })

      it('tags appear in swagger spec', async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/swagger-tagged',
              method: 'get',
              tags: ['my-tag'],
              callback: () => ({}),
            },
          ],
          '/'
        )
        const spec = await (await fetchSwagger(port)).json()
        const pathEntry = spec.paths['/swagger-tagged']
        assert.ok(pathEntry !== undefined)
        assert.ok(pathEntry.get.tags.includes('my-tag'))
        assert.ok(pathEntry.get.tags.includes('external'))
      })

      it('custom responses appear in swagger spec', async () => {
        restApi.registerRestRoutes(
          [
            {
              endpoint: '/swagger-custom-responses',
              method: 'get',
              responses: [
                {
                  status: 200,
                  description: 'A custom OK',
                  schema: {
                    id: {
                      type: 'string',
                    },
                  },
                },
              ],
              callback: () => ({}),
            },
          ],
          '/'
        )
        const spec = await (await fetchSwagger(port)).json()
        const pathEntry = spec.paths['/swagger-custom-responses']
        assert.ok(pathEntry !== undefined)
        assert.equal(pathEntry.get.responses['200'].description, 'A custom OK')
      })
    })
  })
})
