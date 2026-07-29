import assert from 'node:assert'
import { describe, it } from 'node:test'
import { noSuchObject } from 'xo-common/api-errors.js'
import * as CM from 'complex-matcher'
import { RestApi } from './rest-api.mjs'

const makeRestApi = xoApp => new RestApi(xoApp as any, undefined as any)

describe('RestApi#buildResolver', () => {
  const store = {
    vm1: { $SR: 'sr1' },
    sr1: { tags: ['prod'] },
  }
  const anyStore = { ...store, user1: { email: 'test@test.com' } }
  const makeApp = (over = {}) => ({
    getObject: id => store[id], // used by this.resolver fallback
    getAnyObject: async id => {
      const o = anyStore[id]
      if (o === undefined) throw noSuchObject(id)
      return o
    },
    ...over,
  })

  it('resolves a single referenced id', async () => {
    const api = makeRestApi(makeApp())
    const node = CM.parse('$SR:[resolve]:tags:prod')
    const resolver = await api.buildResolver({ $SR: 'sr1' }, node)
    assert.deepEqual(resolver('sr1'), { tags: ['prod'] })
  })

  it('skips an unresolvable id (noSuchObject) instead of throwing', async () => {
    const api = makeRestApi(makeApp())
    const node = CM.parse('$SR:[resolve]:tags:prod')
    await assert.doesNotReject(() => api.buildResolver({ $SR: 'missing' }, node))
  })

  it('propagates a genuine (non-noSuchObject) error', async () => {
    const api = makeRestApi(
      makeApp({
        getAnyObject: async () => {
          throw new Error('db down')
        },
      })
    )
    const node = CM.parse('$SR:[resolve]:tags:prod')
    await assert.rejects(() => api.buildResolver({ $SR: 'sr1' }, node), /db down/)
  })

  it('resolves a nested referenced id via getAnyObject prefetch', async () => {
    const api = makeRestApi(makeApp())
    const node = CM.parse('properties:userId:[resolve]:email:"test@test.com"')
    const resolver = await api.buildResolver({ properties: { userId: 'user1' } }, node)
    assert.deepEqual(resolver('user1'), { email: 'test@test.com' })
  })
})
