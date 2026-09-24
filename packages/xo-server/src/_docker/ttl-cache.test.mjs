import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { AsyncTtlCache } from './ttl-cache.mjs'

const createClock = () => {
  const clock = () => clock.time
  clock.time = 0
  return clock
}

describe('AsyncTtlCache', () => {
  it('shares pending fetches and caches values for expiresIn', async () => {
    const now = createClock()
    const cache = new AsyncTtlCache({ expiresIn: 10, now })
    let calls = 0
    const fn = async () => ++calls
    assert.deepEqual(await Promise.all([cache.get('k', fn), cache.get('k', fn)]), [1, 1])
    assert.equal(cache.peek('k'), 1)
    now.time = 9
    assert.equal(await cache.get('k', fn), 1)
    now.time = 10
    assert.equal(cache.peek('k'), undefined)
    assert.equal(await cache.get('k', fn), 2)
  })

  it('does not cache rejections', async () => {
    const cache = new AsyncTtlCache({ expiresIn: 10 })
    await assert.rejects(
      cache.get('k', async () => {
        throw new Error('boom')
      }),
      /boom/
    )
    assert.equal(cache.size, 0)
    assert.equal(await cache.get('k', async () => 'ok'), 'ok')
  })

  it('forceRefresh ignores a cached value', async () => {
    const cache = new AsyncTtlCache({ expiresIn: 1e3 })
    await cache.get('k', async () => 1)
    assert.equal(await cache.get('k', async () => 2, { forceRefresh: true }), 2)
    assert.equal(cache.peek('k'), 2)
  })

  it('deleteByPrefix() and sweep()', async () => {
    const now = createClock()
    const cache = new AsyncTtlCache({ expiresIn: 10, now })
    await cache.get('a:1', async () => 1)
    await cache.get('a:2', async () => 2)
    await cache.get('b:1', async () => 3)
    cache.deleteByPrefix('a:')
    assert.equal(cache.size, 1)
    now.time = 10
    cache.sweep()
    assert.equal(cache.size, 0)
  })

  it('a value fetched before a deletion is not cached', async () => {
    const cache = new AsyncTtlCache({ expiresIn: 1e3 })
    let resolve
    const promise = cache.get('k', () => new Promise(_resolve => (resolve = _resolve)))
    cache.delete('k')
    resolve('stale')
    assert.equal(await promise, 'stale')
    assert.equal(cache.peek('k'), undefined)
  })
})
