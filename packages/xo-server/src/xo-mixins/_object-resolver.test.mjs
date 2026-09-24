import assert from 'assert/strict'
import test from 'node:test'
import * as CM from 'complex-matcher'
import { noSuchObject } from 'xo-common/api-errors.js'

import ObjectResolver from './object-resolver.mjs'

const { describe, it } = test

describe('ObjectResolver', function () {
  describe('buildResolver', function () {
    // only XAPI objects are reachable through `getObject`, the others are only
    // reachable through the asynchronous `getAnyObject`
    const xapiObjects = {
      vm1: { $SR: 'sr1' },
      sr1: { tags: ['prod'] },
    }
    const anyObjects = { ...xapiObjects, user1: { email: 'test@test.com' } }

    const makeApp = (over = {}) => ({
      getObject: id => xapiObjects[id],
      getAnyObject: async id => {
        const object = anyObjects[id]
        if (object === undefined) {
          throw noSuchObject(id)
        }
        return object
      },
      ...over,
    })

    it('resolves a single referenced id', async function () {
      const objectResolver = new ObjectResolver(makeApp())
      const node = CM.parse('$SR:[resolve]:tags:prod')

      const resolver = await objectResolver.buildResolver({ $SR: 'sr1' }, node)

      assert.deepEqual(resolver('sr1'), { tags: ['prod'] })
    })

    it('skips an unresolvable id (noSuchObject) instead of throwing', async function () {
      const objectResolver = new ObjectResolver(makeApp())
      const node = CM.parse('$SR:[resolve]:tags:prod')

      await assert.doesNotReject(() => objectResolver.buildResolver({ $SR: 'missing' }, node))
    })

    it('propagates a genuine (non-noSuchObject) error', async function () {
      const objectResolver = new ObjectResolver(
        makeApp({
          getAnyObject: async () => {
            throw new Error('db down')
          },
        })
      )
      const node = CM.parse('$SR:[resolve]:tags:prod')

      await assert.rejects(() => objectResolver.buildResolver({ $SR: 'sr1' }, node), /db down/)
    })

    it('resolves a nested referenced id via getAnyObject prefetch', async function () {
      const objectResolver = new ObjectResolver(makeApp())
      const node = CM.parse('properties:userId:[resolve]:email:"test@test.com"')

      const resolver = await objectResolver.buildResolver({ properties: { userId: 'user1' } }, node)

      assert.deepEqual(resolver('user1'), { email: 'test@test.com' })
    })

    it('falls back to xapiObjectResolver for an id which was not prefetched', async function () {
      const objectResolver = new ObjectResolver(makeApp())
      const node = CM.parse('$SR:[resolve]:tags:prod')

      const resolver = await objectResolver.buildResolver({ $SR: 'sr1' }, node)

      // `vm1` is not referenced by the filter, so it is only reachable through the fallback
      assert.deepEqual(resolver('vm1'), { $SR: 'sr1' })
    })
  })
})
