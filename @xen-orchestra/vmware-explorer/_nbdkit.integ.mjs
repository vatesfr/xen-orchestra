import assert from 'node:assert/strict'
import { createServer } from 'node:net'
import { describe, it } from 'node:test'

import { findFreePort, waitForPort } from './_nbdkit.mjs'

// these bind a real port
describe('findFreePort', function () {
  it('returns a port which can be bound', async function () {
    const port = await findFreePort()

    assert.equal(typeof port, 'number')
    const server = createServer()
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(port, '127.0.0.1', resolve)
    })
    server.close()
  })
})

describe('waitForPort', function () {
  it('resolves as soon as the port accepts a connection', async function () {
    const port = await findFreePort()
    const server = createServer()
    // start listening later, as nbdkit does once its plugin is configured
    const timer = setTimeout(() => server.listen(port, '127.0.0.1'), 30)

    try {
      await waitForPort(port, { probeDelay: 5, timeout: 2e3 })
    } finally {
      clearTimeout(timer)
      server.close()
    }
  })

  it('gives up with the reason of the last attempt', async function () {
    const port = await findFreePort()

    await assert.rejects(waitForPort(port, { probeDelay: 1, timeout: 20 }), error => {
      assert.match(error.message, /nothing is listening on 127\.0\.0\.1:/)
      assert.equal(error.code, 'NBDKIT_NOT_LISTENING')
      assert.equal(error.cause.code, 'ECONNREFUSED')
      return true
    })
  })

  it('stops probing when aborted', async function () {
    const port = await findFreePort()

    await assert.rejects(waitForPort(port, { probeDelay: 1, signal: AbortSignal.abort(), timeout: 1e3 }), {
      name: 'AbortError',
    })
  })
})
