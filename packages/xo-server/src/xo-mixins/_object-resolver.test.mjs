import assert from 'assert/strict'
import test from 'node:test'
import * as CM from 'complex-matcher'
import { featureUnauthorized, noSuchObject } from 'xo-common/api-errors.js'

import ObjectResolver from './object-resolver.mjs'

const { describe, it } = test

describe('ObjectResolver', function () {
  describe('buildResolver', function () {
    // only XAPI objects are reachable through `getObject`, the others are only
    // reachable through the asynchronous `getAnyObject`
    const xapiObjects = {
      // `creation` is written by xo-server on the XAPI object itself, so a XAPI
      // object can reference a non-XAPI one
      vm1: { $SR: 'sr1', creation: { user: 'user1' } },
      sr1: { tags: ['prod'] },
    }
    const anyObjects = { ...xapiObjects, user1: { email: 'test@test.com' } }

    const makeApp = (over = {}) => ({
      // `getObject` is synchronous and throws when the id is unknown
      getObject: id => {
        const object = xapiObjects[id]
        if (object === undefined) {
          throw noSuchObject(id)
        }
        return object
      },
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

    it('resolves a non-XAPI object referenced by a XAPI object', async function () {
      const objectResolver = new ObjectResolver(makeApp())
      const node = CM.parse('$VM:[resolve]:creation:user:[resolve]:email:"test@test.com"')

      const resolver = await objectResolver.buildResolver({ $VM: 'vm1' }, node)

      // first hop is a XAPI object, second one is only reachable through `getAnyObject`
      assert.deepEqual(resolver('vm1'), xapiObjects.vm1)
      assert.deepEqual(resolver('user1'), { email: 'test@test.com' })
    })

    it('matches through a XAPI object onto a non-XAPI one', async function () {
      const objectResolver = new ObjectResolver(makeApp())
      const node = CM.parse('$VM:[resolve]:creation:user:[resolve]:email:"test@test.com"')
      const object = { $VM: 'vm1' }

      const resolver = await objectResolver.buildResolver(object, node)

      assert(node.createPredicate(resolver)(object))
    })
  })

  describe('getAnyObject', function () {
    const notFound = async () => {
      throw noSuchObject()
    }

    // `getAnyObject` looks an id up in three tiers, ordered by cost:
    //   1. `getObject`, synchronous, every XAPI object
    //   2. the cheap store reads, raced against each other
    //   3. the costly backup archive and log lookups
    const makeApp = (over = {}) => ({
      getObject: id => {
        if (id !== 'vm') {
          throw noSuchObject(id)
        }
        return { id, type: 'VM' }
      },
      // an installation without an RBAC licence rejects these
      getAclV2Privilege: async () => {
        throw featureUnauthorized({ featureCode: 'RBAC' })
      },
      getAclV2Role: async () => {
        throw featureUnauthorized({ featureCode: 'RBAC' })
      },
      getGroup: notFound,
      getJob: notFound,
      getProxy: notFound,
      getRemote: notFound,
      getSchedule: notFound,
      tasks: { get: notFound },
      getUser: async id => {
        if (id !== 'user') {
          throw noSuchObject(id)
        }
        return { id, email: 'test@test.com' }
      },
      getXenServer: notFound,
      getVmBackupArchive: async id => {
        if (id !== 'archive') {
          throw noSuchObject(id)
        }
        return { id, kind: 'archive' }
      },
      getBackupNgLogs: async id => {
        if (id !== 'log') {
          throw noSuchObject(id)
        }
        return { id, message: 'backup' }
      },
      ...over,
    })

    it('returns an XAPI object', async function () {
      assert.deepEqual(await new ObjectResolver(makeApp()).getAnyObject('vm'), { id: 'vm', type: 'VM' })
    })

    it('returns an object found by one of the cheap getters', async function () {
      assert.deepEqual(await new ObjectResolver(makeApp()).getAnyObject('user'), {
        id: 'user',
        email: 'test@test.com',
      })
    })

    it('obfuscates the password of a resolved user', async function () {
      let opts
      const objectResolver = new ObjectResolver(
        makeApp({
          getUser: async (id, _opts) => {
            opts = _opts
            return { id, pw_hash: 'secret' }
          },
        })
      )

      await objectResolver.getAnyObject('user')

      assert.deepEqual(opts, { obfuscatePassword: true })
    })

    it('ignores featureUnauthorized raised by the RBAC getters', async function () {
      // `user` is only found once the RBAC rejections have been ignored
      assert.deepEqual(await new ObjectResolver(makeApp()).getAnyObject('user'), {
        id: 'user',
        email: 'test@test.com',
      })
    })

    it('falls through to the costly getters', async function () {
      const objectResolver = new ObjectResolver(makeApp())

      assert.deepEqual(await objectResolver.getAnyObject('archive'), { id: 'archive', kind: 'archive' })
      assert.deepEqual(await objectResolver.getAnyObject('log'), { id: 'log', message: 'backup' })
    })

    it('does not reach the costly getters when a cheaper one matches', async function () {
      let costlyCalls = 0
      const costly = async () => {
        costlyCalls++
        throw noSuchObject()
      }
      const objectResolver = new ObjectResolver(makeApp({ getVmBackupArchive: costly, getBackupNgLogs: costly }))

      await objectResolver.getAnyObject('vm')
      await objectResolver.getAnyObject('user')

      assert.equal(costlyCalls, 0)
    })

    it('throws noSuchObject when no collection holds the id', async function () {
      await assert.rejects(
        () => new ObjectResolver(makeApp()).getAnyObject('ghost'),
        error => noSuchObject.is(error)
      )
    })

    it('propagates a genuine error raised by a cheap getter', async function () {
      const objectResolver = new ObjectResolver(
        makeApp({
          getGroup: async () => {
            throw new Error('db down')
          },
        })
      )

      await assert.rejects(() => objectResolver.getAnyObject('ghost'), /db down/)
    })

    it('propagates a genuine error raised by a costly getter', async function () {
      const objectResolver = new ObjectResolver(
        makeApp({
          getBackupNgLogs: async () => {
            throw new Error('remote unreachable')
          },
        })
      )

      await assert.rejects(() => objectResolver.getAnyObject('ghost'), /remote unreachable/)
    })
  })
})
