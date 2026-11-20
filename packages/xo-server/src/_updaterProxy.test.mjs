import assert from 'assert/strict'
import test from 'node:test'

import { invalidCredentials } from 'xo-common/api-errors.js'

import { authenticateUpdater, createProxyUpgradeHandler, isUpdaterProxyPath } from './_updaterProxy.mjs'

const { describe, it } = test

const isInvalidCredentials = error => invalidCredentials.is(error)

const createRequest = (cookie, url = '/api/updater') => ({
  headers: { cookie },
  socket: { remoteAddress: '192.0.2.1' },
  url,
})

const neverCalled = {
  async authenticateUser() {
    assert.fail('authenticateUser must not be called')
  },
}

const xoWithPermission = permission => ({
  async authenticateUser() {
    return { user: { permission } }
  },
})

describe('isUpdaterProxyPath()', () => {
  for (const url of [
    '/api/updater',
    '/api/updater/',
    '/api/updater?foo=bar',
    '/api/updater-other',
    '/api/updater%2F',
    '/v5/api/updater',
    '/v5/api/updater?foo=bar',
    '/v5/api/updater-other',
  ]) {
    it(`matches ${url}`, () => {
      assert.equal(isUpdaterProxyPath(url), true)
    })
  }

  for (const url of ['/api', '/api/', '/v5/api', '/v5/api/', '/v5/netdata']) {
    it(`does not match ${url}`, () => {
      assert.equal(isUpdaterProxyPath(url), false)
    })
  }
})

describe('authenticateUpdater()', () => {
  it('rejects a connection without a cookie', async () => {
    await assert.rejects(
      authenticateUpdater(createRequest(), neverCalled, () => false),
      isInvalidCredentials
    )
  })

  it('rejects a cookie without a token', async () => {
    await assert.rejects(
      authenticateUpdater(createRequest('lang=en'), neverCalled, () => false),
      isInvalidCredentials
    )
  })

  it('rejects an invalid token', async () => {
    const xo = {
      async authenticateUser() {
        throw invalidCredentials()
      },
    }

    await assert.rejects(
      authenticateUpdater(createRequest('token=invalid'), xo, () => false),
      isInvalidCredentials
    )
  })

  it('rejects a non-admin user', async () => {
    await assert.rejects(
      authenticateUpdater(createRequest('token=valid'), xoWithPermission('user'), () => false),
      isInvalidCredentials
    )
  })

  it('accepts an admin user and forwards the remote address', async () => {
    const xo = {
      async authenticateUser({ token }, { ip }) {
        assert.equal(token, 'valid')
        assert.equal(ip, '192.0.2.1')
        return { user: { permission: 'admin' } }
      },
    }

    await authenticateUpdater(createRequest('token=valid'), xo, () => false)
  })
})

describe('createProxyUpgradeHandler()', () => {
  const opts = {
    '/v5/api': 'ws://localhost:80/api',
    '/api/updater': 'ws://localhost:9001',
    '/v5/netdata': 'ws://localhost:80/netdata',
  }

  const setUp = (xo, userHttpConfig = { port: 80 }) => {
    const proxied = []
    const logged = []
    const handler = createProxyUpgradeHandler({
      log: { warn: (...args) => logged.push(args) },
      opts,
      proxy: { ws: (req, socket, head, options) => proxied.push(options.target) },
      useForwardedHeaders: () => false,
      userHttpConfig,
      xo,
    })
    const createSocket = () => {
      const socket = { ended: undefined, end: data => (socket.ended = data) }
      return socket
    }
    return { createSocket, handler, logged, proxied }
  }

  for (const url of ['/api/updater', '/api/updater-x', '/v5/api/updater', '/v5/api/updaterX', '/v5/api/updater/']) {
    it(`refuses an unauthenticated upgrade on ${url}`, async () => {
      const { createSocket, handler, logged, proxied } = setUp(neverCalled)
      const socket = createSocket()

      await handler(createRequest(undefined, url), socket, Buffer.alloc(0))

      assert.deepEqual(proxied, [])
      assert.match(socket.ended, /^HTTP\/1\.1 403 /)
      assert.equal(logged.length, 1)
    })
  }

  it('refuses a non-admin and does not log the token', async () => {
    const { createSocket, handler, logged, proxied } = setUp(xoWithPermission('user'))
    const socket = createSocket()

    await handler(createRequest('token=secret-token', '/api/updater'), socket, Buffer.alloc(0))

    assert.deepEqual(proxied, [])
    assert.match(socket.ended, /^HTTP\/1\.1 403 /)
    assert.doesNotMatch(JSON.stringify(logged), /secret-token/)
  })

  it('proxies an admin upgrade to the updater', async () => {
    const { createSocket, handler, proxied } = setUp(xoWithPermission('admin'))
    const socket = createSocket()

    await handler(createRequest('token=valid', '/api/updater'), socket, Buffer.alloc(0))

    assert.deepEqual(proxied, ['ws://localhost:9001/'])
    assert.equal(socket.ended, undefined)
  })

  it('keeps the updater on loopback when xo-server is bound to a specific address', async () => {
    const { createSocket, handler, proxied } = setUp(xoWithPermission('admin'), { hostname: '192.0.2.5', port: 80 })

    await handler(createRequest('token=valid', '/api/updater'), createSocket(), Buffer.alloc(0))
    await handler(createRequest('token=valid', '/v5/api/updater'), createSocket(), Buffer.alloc(0))

    assert.deepEqual(proxied, ['ws://localhost:9001/', 'ws://192.0.2.5/api/updater'])
  })

  it('proxies other prefixes without authentication', async () => {
    const { createSocket, handler, proxied } = setUp(neverCalled)

    await handler(createRequest(undefined, '/v5/netdata/foo'), createSocket(), Buffer.alloc(0))

    assert.deepEqual(proxied, ['ws://localhost/netdata/foo'])
  })
})
