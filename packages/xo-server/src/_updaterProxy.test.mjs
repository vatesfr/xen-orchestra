import assert from 'assert/strict'
import test from 'node:test'

import { authenticateUpdater, isUpdaterProxyPath } from './_updaterProxy.mjs'

const { describe, it } = test

const createRequest = cookie => ({
  headers: { cookie },
  socket: { remoteAddress: '192.0.2.1' },
})

describe('isUpdaterProxyPath()', () => {
  for (const url of ['/api/updater', '/v5/api/updater', '/v5/api/updater?foo=bar']) {
    it(`matches ${url}`, () => {
      assert.equal(isUpdaterProxyPath(url), true)
    })
  }

  for (const url of ['/api', '/v5/api', '/v5/api/updater-other']) {
    it(`does not match ${url}`, () => {
      assert.equal(isUpdaterProxyPath(url), false)
    })
  }
})

describe('authenticateUpdater()', () => {
  it('rejects a connection without a cookie', async () => {
    await assert.rejects(authenticateUpdater(createRequest(), {}, () => false))
  })

  it('rejects an invalid token', async () => {
    const xo = {
      async authenticateUser() {
        throw new Error('invalid credentials')
      },
    }

    await assert.rejects(authenticateUpdater(createRequest('token=invalid'), xo, () => false))
  })

  it('rejects a non-admin user', async () => {
    const xo = {
      async authenticateUser() {
        return { user: { permission: 'user' } }
      },
    }

    await assert.rejects(authenticateUpdater(createRequest('token=valid'), xo, () => false))
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
