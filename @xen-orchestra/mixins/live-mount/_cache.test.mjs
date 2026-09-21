import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { normalizeCacheOptions, resolveCacheSr } from './_cache.mjs'

const makeConfig = (values = {}) => ({ getOptional: path => values[path] })

describe('normalizeCacheOptions', () => {
  it('gives no cache when nothing asks for one', () => {
    assert.equal(normalizeCacheOptions(undefined, makeConfig()), undefined)
    assert.equal(normalizeCacheOptions(false, makeConfig({ 'iscsi.cache': true })), undefined)
  })

  it('falls back to the config when the caller says nothing', () => {
    assert.deepEqual(normalizeCacheOptions(undefined, makeConfig({ 'iscsi.cache': true })), {
      hydrate: false,
      srUuid: undefined,
    })
  })

  it('takes the configured SR and hydration', () => {
    assert.deepEqual(
      normalizeCacheOptions(true, makeConfig({ 'iscsi.cacheHydrate': true, 'iscsi.cacheSr': 'sr-uuid' })),
      { hydrate: true, srUuid: 'sr-uuid' }
    )
  })

  it('lets the caller override each configured default', () => {
    const config = makeConfig({ 'iscsi.cache': true, 'iscsi.cacheHydrate': true, 'iscsi.cacheSr': 'configured' })
    assert.deepEqual(normalizeCacheOptions({ hydrate: false, srUuid: 'asked' }, config), {
      hydrate: false,
      srUuid: 'asked',
    })
  })

  it('enables the cache for this mount even when the config does not', () => {
    assert.deepEqual(normalizeCacheOptions(true, makeConfig({ 'iscsi.cache': false })), {
      hydrate: false,
      srUuid: undefined,
    })
  })
})

describe('resolveCacheSr', () => {
  const makeXapi = (answers = {}) => {
    const calls = []
    return {
      calls,
      async call(method, ...args) {
        calls.push([method, ...args])
        return answers[method]
      },
    }
  }

  it('resolves the SR asked for, without looking at the pool', async () => {
    const xapi = makeXapi({ 'SR.get_by_uuid': 'OpaqueRef:asked' })
    assert.equal(await resolveCacheSr(xapi, 'sr-uuid'), 'OpaqueRef:asked')
    assert.deepEqual(xapi.calls, [['SR.get_by_uuid', 'sr-uuid']])
  })

  it('falls back to the pool default SR', async () => {
    const xapi = makeXapi({ 'pool.get_all': ['OpaqueRef:pool'], 'pool.get_default_SR': 'OpaqueRef:default' })
    assert.equal(await resolveCacheSr(xapi, undefined), 'OpaqueRef:default')
    assert.deepEqual(xapi.calls, [['pool.get_all'], ['pool.get_default_SR', 'OpaqueRef:pool']])
  })

  it('names the config key when the pool has no default SR', async () => {
    for (const defaultSr of ['OpaqueRef:NULL', undefined]) {
      const xapi = makeXapi({ 'pool.get_all': ['OpaqueRef:pool'], 'pool.get_default_SR': defaultSr })
      await assert.rejects(resolveCacheSr(xapi, undefined), /set iscsi.cacheSr/)
    }
  })
})
