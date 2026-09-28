import assert from 'node:assert/strict'
import { test } from 'node:test'
import WebSocket from 'ws'
import { incorrectState, noSuchObject } from 'xo-common/api-errors.js'
import { BrowserMedia } from './browser-media.mjs'
import { registerBrowserMediaRest } from './browser-media-rest.mjs'

function fixture() {
  const media = new BrowserMedia()
  const xo = {
    getObject(id, type) {
      assert.equal(type, 'VM')
      if (id !== 'vm') noSuchObject(id, type)
      return { id, power_state: 'Halted' }
    },
    registerRestRoutes(routes) {
      this.routes = routes
      return () => {}
    },
  }
  registerBrowserMediaRest(xo, media)
  const route = (method, endpoint) => xo.routes.find(route => route.method === method && route.endpoint === endpoint)
  const restApi = user => ({ getCurrentUser: () => ({ id: user }) })
  const call = (method, endpoint, { user = 'admin', params = {}, query = {}, body, createAction } = {}) => {
    const res = {
      status(code) {
        this.statusCode = code
        return this
      },
    }
    const result = route(method, endpoint).callback({
      req: { params, query, body },
      res,
      restApi: restApi(user),
      createAction,
    })
    return { result, res }
  }
  return { media, call, routes: xo.routes }
}

test('every route is documented, tagged and scoped under browser-media', () => {
  const { media, routes } = fixture()
  try {
    assert.deepEqual(
      routes.map(({ method, endpoint }) => `${method} ${endpoint}`),
      ['get browser-media', 'post browser-media', 'post browser-media/{id}/actions/attach', 'delete browser-media/{id}']
    )
    for (const route of routes) {
      assert.match(route.description, /Required privilege:\n- administrator$/)
      assert.ok(route.tags.includes('browser-media'))
      // no ACL middleware: administrators only
      assert.ok(!route.middlewares?.some(middleware => middleware.name === 'acl'))
    }
  } finally {
    media.stop()
  }
})

test('creates a session for an existing VM and lists it for its owner only', () => {
  const { media, call } = fixture()
  try {
    const { result, res } = call('post', 'browser-media', { body: { vmId: 'vm', name: 'boot.iso', size: 32768 } })
    assert.equal(res.statusCode, 201)
    assert.match(result.socket, /^\/api\/browser-media\/[0-9a-f]{64}\/socket$/)
    assert.deepEqual(call('get', 'browser-media').result, [
      { id: result.id, vmId: 'vm', name: 'boot.iso', size: 32768, status: 'waiting-for-browser' },
    ])
    assert.deepEqual(call('get', 'browser-media', { user: 'other' }).result, [])
    assert.throws(
      () => call('post', 'browser-media', { body: { vmId: 'missing', name: 'boot.iso', size: 32768 } }),
      noSuchObject.is
    )
  } finally {
    media.stop()
  }
})

test('attach reports a missing or unattachable session before starting a task, and honors sync', () => {
  const { media, call } = fixture()
  try {
    const { result: session } = call('post', 'browser-media', { body: { vmId: 'vm', name: 'boot.iso', size: 32768 } })
    const createAction = () => assert.fail('no task must be created')
    const attach = options => call('post', 'browser-media/{id}/actions/attach', { createAction, ...options })
    assert.throws(() => attach({ params: { id: 'missing' } }), noSuchObject.is)
    assert.throws(() => attach({ params: { id: session.id }, user: 'other' }), noSuchObject.is)
    // the browser never connected
    assert.throws(
      () => attach({ params: { id: session.id } }),
      error => incorrectState.is(error, { actual: 'waiting-for-browser' })
    )

    media.sessions.get(session.id).socket = { readyState: WebSocket.OPEN, terminate() {} }
    let options
    attach({
      params: { id: session.id },
      query: { sync: true },
      createAction: (callback, opts) => {
        options = opts
      },
    })
    assert.equal(options.sync, true)
    assert.deepEqual(options.taskProperties, { name: 'attach browser media', objectId: 'vm' })
  } finally {
    media.stop()
  }
})

test('delete accepts a disconnected session whose storage is still being released', async () => {
  const { media, call } = fixture()
  try {
    const { result: session } = call('post', 'browser-media', { body: { vmId: 'vm', name: 'boot.iso', size: 32768 } })
    media.sessions.get(session.id).onClose = () => {}
    media.close(media.sessions.get(session.id))
    assert.equal(call('get', 'browser-media').result[0].status, 'disconnected')
    assert.equal(await call('delete', 'browser-media/{id}', { params: { id: session.id } }).result, undefined)
    await assert.rejects(
      async () => call('delete', 'browser-media/{id}', { params: { id: 'missing' } }).result,
      noSuchObject.is
    )
  } finally {
    media.stop()
  }
})
