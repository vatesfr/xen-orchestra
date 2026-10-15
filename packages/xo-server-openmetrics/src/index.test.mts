/**
 * Tests for the plugin configuration (Prometheus secret handling)
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { setImmediate } from 'node:timers/promises'

import { configurationSchema, ensureSecret, TtlCache } from './index.mjs'

describe('configurationSchema', () => {
  it('does not generate the secret as a schema default', () => {
    // a `default` here is re-evaluated on every module load and never persisted
    // by xo-server, which used to change the Prometheus secret at each restart
    assert.equal((configurationSchema.properties.secret as Record<string, unknown>).default, undefined)
  })
})

describe('ensureSecret', () => {
  it('generates and persists a secret when none is configured', async () => {
    const persisted: unknown[] = []
    const secret = await ensureSecret(undefined, async configuration => {
      persisted.push(configuration)
    })

    assert.match(secret, /^[0-9a-f]{64}$/)
    assert.deepEqual(persisted, [{ secret }])
  })

  it('generates and persists a secret when the configured one is empty', async () => {
    const persisted: unknown[] = []
    const secret = await ensureSecret({ secret: '' }, async configuration => {
      persisted.push(configuration)
    })

    assert.match(secret, /^[0-9a-f]{64}$/)
    assert.deepEqual(persisted, [{ secret }])
  })

  it('keeps the configured secret and persists nothing', async () => {
    const persisted: unknown[] = []
    const secret = await ensureSecret({ secret: 'cafecafecafecafe' }, async configuration => {
      persisted.push(configuration)
    })

    assert.equal(secret, 'cafecafecafecafe')
    assert.deepEqual(persisted, [])
  })
})

describe('TtlCache', () => {
  it('waits for the first load', async () => {
    const cache = new TtlCache<string>('test', 0)
    assert.equal(await cache.get(async () => 'a'), 'a')
  })

  it('serves the expired snapshot immediately and reloads in the background', async () => {
    // ttl 0: every snapshot is expired by the next call
    const cache = new TtlCache<string>('test', 0)
    await cache.get(async () => 'a')

    // a hanging loader (e.g. ipmitool.py on a dead BMC) must not delay the caller:
    // the stale value must come back before the event loop turns
    const stale = cache.get(() => new Promise(() => {}))
    assert.equal(await Promise.race([stale, setImmediate('still waiting')]), 'a')
  })

  it('serves the reloaded value once the reload lands', async () => {
    const cache = new TtlCache<string>('test', 0)
    await cache.get(async () => 'a')
    assert.equal(await cache.get(async () => 'b'), 'a')
    // let the settled reload run its continuations inside the cache
    await setImmediate()
    assert.equal(await cache.get(() => new Promise(() => {})), 'b')
  })

  it('rejects the caller when the first load fails, then retries', async () => {
    const cache = new TtlCache<string>('test', 0)
    await assert.rejects(
      cache.get(() => Promise.reject(new Error('boom'))),
      { message: 'boom' }
    )
    assert.equal(await cache.get(async () => 'a'), 'a')
  })

  it('drops the snapshot when a background reload fails, so the next call reports the error', async () => {
    const cache = new TtlCache<string>('test', 0)
    await cache.get(async () => 'a')
    assert.equal(await cache.get(() => Promise.reject(new Error('boom'))), 'a')
    await setImmediate()
    await assert.rejects(
      cache.get(() => Promise.reject(new Error('again'))),
      { message: 'again' }
    )
  })

  it('shares one reload between callers while it is in flight', async () => {
    let loads = 0
    const cache = new TtlCache<string>('test', 0)
    await cache.get(async () => 'a')
    const load = () => {
      ++loads
      return new Promise<string>(() => {})
    }
    await cache.get(load)
    await cache.get(load)
    assert.equal(loads, 1)
  })
})
