import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { autoReconnect, MAX_DELAY } from './_xenServerAutoReconnect.mjs'

const noopLog = { debug: () => {}, warn: () => {} }

function makeDeps(overrides) {
  return {
    connect: async () => {},
    delay: () => Promise.resolve(),
    getServer: async () => ({ enabled: true }),
    getStatus: () => 'disconnected',
    log: noopLog,
    ...overrides,
  }
}

describe('autoReconnect', () => {
  it('reconnects after transient failures', async () => {
    let attempts = 0
    const outcome = await autoReconnect(
      's1',
      makeDeps({
        connect: async () => {
          if (++attempts < 3) {
            throw new Error('EHOSTUNREACH')
          }
        },
      })
    )
    assert.equal(outcome, 'connected')
    assert.equal(attempts, 3)
  })

  it('stops when the server is disabled', async () => {
    const outcome = await autoReconnect('s1', makeDeps({ getServer: async () => ({ enabled: false }) }))
    assert.equal(outcome, 'server disabled')
  })

  it('stops when the server was deleted', async () => {
    const outcome = await autoReconnect(
      's1',
      makeDeps({
        getServer: async () => {
          throw new Error('no such object')
        },
        isGone: error => error.message === 'no such object',
      })
    )
    assert.equal(outcome, 'server deleted')
  })

  it('survives transient getServer failures when isGone says the server still exists', async () => {
    let reads = 0
    let attempts = 0
    const outcome = await autoReconnect(
      's1',
      makeDeps({
        getServer: async () => {
          if (++reads === 1) {
            throw new Error('database hiccup')
          }
          return { enabled: true }
        },
        isGone: () => false,
        connect: async () => {
          ++attempts
        },
      })
    )
    assert.equal(outcome, 'connected')
    assert.equal(reads, 2)
    assert.equal(attempts, 1)
  })

  it('stops when the server was reconnected by other means', async () => {
    let connectCalled = false
    const outcome = await autoReconnect(
      's1',
      makeDeps({
        getStatus: () => 'connected',
        connect: async () => {
          connectCalled = true
        },
      })
    )
    assert.equal(outcome, 'already connected')
    assert.equal(connectCalled, false)
  })

  it('gives up immediately on authentication failure', async () => {
    let attempts = 0
    const outcome = await autoReconnect(
      's1',
      makeDeps({
        connect: async () => {
          ++attempts
          const error = new Error('authentication failed')
          error.code = 'SESSION_AUTHENTICATION_FAILED'
          throw error
        },
      })
    )
    assert.equal(outcome, 'permanent error')
    assert.equal(attempts, 1)
  })

  it('gives up immediately on errors reported fatal by isFatal', async () => {
    let attempts = 0
    const outcome = await autoReconnect(
      's1',
      makeDeps({
        connect: async () => {
          ++attempts
          throw new Error('pool already connected')
        },
        isFatal: error => error.message === 'pool already connected',
      })
    )
    assert.equal(outcome, 'permanent error')
    assert.equal(attempts, 1)
  })

  it('starts fast and caps delays at MAX_DELAY', async () => {
    const delays = []
    let attempts = 0
    const outcome = await autoReconnect(
      's1',
      makeDeps({
        delay: async ms => {
          delays.push(ms)
        },
        connect: async () => {
          if (++attempts < 15) {
            throw new Error('still down')
          }
        },
      })
    )
    assert.equal(outcome, 'connected')
    assert.ok(delays[0] <= 2e3, `first delay should be short, got ${delays[0]}`)
    assert.ok(
      delays.every(ms => ms <= MAX_DELAY),
      'delays must be capped'
    )
    assert.equal(Math.max(...delays), MAX_DELAY)
  })
})
