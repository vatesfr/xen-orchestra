/**
 * Tests for the TtlCache module.
 *
 * TtlCache is a loader-based, time-bounded cache with in-flight coalescing:
 * `get(load)` returns the cached value while fresh, otherwise invokes `load`
 * once and memoizes the result for `ttlMs`. These tests exercise the real
 * `Date.now()`-based mechanism with very short TTLs and tiny real delays to
 * stay deterministic and non-flaky.
 */

import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { describe, it } from 'node:test'

import { TtlCache } from './ttl-cache.mjs'

describe('TtlCache', () => {
  it('stores and retrieves a value: loads once, then serves the cached value while fresh', async () => {
    const cache = new TtlCache<number>(10_000)
    let calls = 0
    const load = async () => {
      calls++
      return 42
    }

    // First get is a miss → invokes the loader and stores the value.
    assert.equal(await cache.get(load), 42)
    assert.equal(calls, 1)

    // Subsequent get while fresh → served from cache, loader NOT re-invoked.
    assert.equal(await cache.get(load), 42)
    assert.equal(calls, 1)
  })

  it('invokes the loader on a cold cache (initial miss has no stored value)', async () => {
    const cache = new TtlCache<string>(10_000)
    let loaded = false

    const value = await cache.get(async () => {
      loaded = true
      return 'fresh'
    })

    // Nothing was cached beforehand, so the loader had to run.
    assert.equal(loaded, true)
    assert.equal(value, 'fresh')
  })

  it('expires the cached value after its TTL elapses', async () => {
    // 20ms TTL keeps the real delay tiny while staying comfortably
    // above timer granularity.
    const cache = new TtlCache<number>(20)
    let calls = 0
    const load = async () => {
      calls++
      return calls
    }

    assert.equal(await cache.get(load), 1)
    assert.equal(calls, 1)

    // Still fresh immediately after.
    assert.equal(await cache.get(load), 1)
    assert.equal(calls, 1)

    // Wait past the TTL → next get is a miss and reloads.
    await delay(40)
    assert.equal(await cache.get(load), 2)
    assert.equal(calls, 2)
  })

  it('overwrites the cached value when reloading after expiry', async () => {
    const cache = new TtlCache<string>(20)

    assert.equal(await cache.get(async () => 'old'), 'old')

    // While fresh, a different loader is ignored — old value is kept.
    assert.equal(await cache.get(async () => 'new'), 'old')

    // After expiry, the reload overwrites the snapshot with the new value.
    await delay(40)
    assert.equal(await cache.get(async () => 'new'), 'new')

    // The new value is now the cached one.
    assert.equal(await cache.get(async () => 'newer'), 'new')
  })
})
