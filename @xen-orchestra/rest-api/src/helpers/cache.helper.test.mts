import assert from 'node:assert'
import { describe, it } from 'node:test'

import { getFromAsyncCache } from './cache.helper.mjs'

describe('getFromAsyncCache()', function () {
  const cacheTest = new Map()
  const cacheTimeout = 500
  const cacheExpiresIn = 1000
  const cacheTestOps = { timeout: cacheTimeout, expiresIn: cacheExpiresIn }
  const sleep = times => new Promise(resolve => setTimeout(resolve, times))

  // start the promise, advance time and return the promise
  const _getFromAsyncCache = async (t, ms, cache, key, fn, opts) => {
    const p = getFromAsyncCache(cache, key, fn, opts)
    t.mock.timers.tick(ms)
    return p
  }

  it('Ensure the callback is called', async t => {
    const cb = t.mock.fn(async () => {})

    assert.equal(cb.mock.callCount(), 0)
    await getFromAsyncCache(cacheTest, 'simpleTest', cb)
    assert.equal(cb.mock.callCount(), 1)
  })

  it('Returns the computed value', async function () {
    const result = await getFromAsyncCache(cacheTest, 'simpleTest', async () => 'foo')
    assert.equal(result?.value, 'foo')
  })

  it('Returns the cached value', async function () {
    const result = await getFromAsyncCache(cacheTest, 'simpleTest', async () => 'bar')
    assert.equal(result?.value, 'foo')
  })

  it('Recomputes the value if forceRefresh is passed', async function () {
    const result = await getFromAsyncCache(cacheTest, 'simpleTest', async () => 'baz', {
      forceRefresh: true,
    })
    assert.equal(result?.value, 'baz')
  })

  it('Returns undefined if the fn takes too long to execute, then returns the computed value when the promise is resolved', async function (t) {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const cb = async () => {
      await sleep(cacheTimeout * 2.5)
      return 'foo'
    }

    const result = await _getFromAsyncCache(t, cacheTimeout, cacheTest, 'timeout', cb, cacheTestOps)
    assert.equal(result?.value, undefined)

    const secondResult = await _getFromAsyncCache(t, cacheTimeout, cacheTest, 'timeout', async () => {}, cacheTestOps)
    assert.equal(secondResult?.value, undefined)

    t.mock.timers.tick(cacheTimeout)
  })

  it('If cached value is expired, returns the new computed value', async function (t) {
    t.mock.timers.enable({ apis: ['Date'], now: 0 })

    const result = await getFromAsyncCache(cacheTest, 'expired', async () => 'foo', cacheTestOps)
    assert.equal(result?.value, 'foo')

    t.mock.timers.setTime(cacheExpiresIn * 2)

    const secondResult = await getFromAsyncCache(cacheTest, 'expired', async () => 'bar', cacheTestOps)
    assert.equal(secondResult?.value, 'bar')
  })

  it('If cached value is expired and the fn takes too long time to execute, returns the expired cached value with "isExpired" property and updates the cache when the promise is resolved', async function (t) {
    t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 0 })
    const cb = async () => {
      await sleep(cacheTimeout * 1.5)
      return 'bar'
    }

    const result = await getFromAsyncCache(cacheTest, 'expiredAndTimeout', async () => 'foo', cacheTestOps)
    assert.equal(result?.value, 'foo')

    t.mock.timers.setTime(cacheExpiresIn * 2)

    const secondResult = await _getFromAsyncCache(t, cacheTimeout, cacheTest, 'expiredAndTimeout', cb, cacheTestOps)
    assert.equal(secondResult?.value, 'foo')
    assert.equal(secondResult?.isExpired, true)
  })
})
