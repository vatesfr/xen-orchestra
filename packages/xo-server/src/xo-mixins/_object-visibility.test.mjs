import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import ObjectVisibility from './object-visibility.mjs'

// ===================================================================

const OBJECTS = {
  'pool-1': { id: 'pool-1', type: 'pool' },
  'vm-1': { id: 'vm-1', type: 'VM', $container: 'pool-1', $pool: 'pool-1' },
  'vm-2': { id: 'vm-2', type: 'VM', $container: 'pool-1', $pool: 'pool-1' },
  'tpl-1': { id: 'tpl-1', type: 'VM-template', $pool: 'pool-1' },
}

// Minimal XoApp mock, counting the calls the cache is meant to avoid
// A connection as `Api#createApiConnection` hands it over, recording what it
// was notified of
const createMockConnection = userId => {
  const notified = []
  return {
    notified,
    get: (key, defaultValue) => (key === 'user_id' ? userId : defaultValue),
    notify: (method, params) => notified.push({ method, params }),
  }
}

const createMockApp = ({ users, permissionsByUser = {}, resourceSetsByUser = {}, connections = [] } = {}) => {
  const calls = { getUser: 0, getPermissionsForUser: 0, getAllResourceSets: 0 }

  return {
    calls,
    apiConnections: connections,
    objects: { all: OBJECTS },
    getObject: id => OBJECTS[id],
    getUser: async id => {
      calls.getUser++
      const user = users[id]
      if (user === undefined) {
        throw new Error(`no such user ${id}`)
      }
      return user
    },
    getPermissionsForUser: async id => {
      calls.getPermissionsForUser++
      return permissionsByUser[id] ?? {}
    },
    getAllResourceSets: async id => {
      calls.getAllResourceSets++
      return resourceSetsByUser[id] ?? []
    },
  }
}

const ADMIN = { id: 'admin-1', permission: 'admin' }
const USER = { id: 'user-1', permission: 'none' }
const OTHER_USER = { id: 'user-2', permission: 'none' }

const USERS = { 'admin-1': ADMIN, 'user-1': USER, 'user-2': OTHER_USER }

// ===================================================================

describe('ObjectVisibility', function () {
  describe('#getObjectFilterForUser()', function () {
    it('returns undefined for an admin, meaning no filtering at all', async function () {
      const app = createMockApp({ users: USERS })
      const mixin = new ObjectVisibility(app)

      assert.equal(await mixin.getObjectFilterForUser('admin-1'), undefined)
    })

    it('never reads the ACLs of an admin', async function () {
      const app = createMockApp({ users: USERS })
      const mixin = new ObjectVisibility(app)

      await mixin.getObjectFilterForUser('admin-1')

      assert.equal(app.calls.getPermissionsForUser, 0)
    })

    it('returns a predicate restricted to the ACLs of a non-admin', async function () {
      const app = createMockApp({
        users: USERS,
        permissionsByUser: { 'user-1': { 'vm-1': { view: 1 } } },
      })
      const mixin = new ObjectVisibility(app)

      const isVisible = await mixin.getObjectFilterForUser('user-1')

      assert.equal(isVisible('vm-1'), true)
      assert.equal(isVisible('vm-2'), false)
    })

    it('includes the objects of the resource sets the user is a subject of', async function () {
      const app = createMockApp({
        users: USERS,
        resourceSetsByUser: { 'user-1': [{ id: 'rs-1', objects: ['tpl-1'] }] },
      })
      const mixin = new ObjectVisibility(app)

      const isVisible = await mixin.getObjectFilterForUser('user-1')

      assert.equal(isVisible('tpl-1'), true)
      assert.equal(isVisible('vm-1'), false)
    })
  })

  // the filter is rebuilt on every object batch; reading Redis each time would
  // put the ACL store on the hot path of the event loop
  describe('caching', function () {
    it('reads the ACLs only once across several calls', async function () {
      const app = createMockApp({ users: USERS })
      const mixin = new ObjectVisibility(app)

      await mixin.getObjectFilterForUser('user-1')
      await mixin.getObjectFilterForUser('user-1')

      assert.equal(app.calls.getPermissionsForUser, 1)
      assert.equal(app.calls.getAllResourceSets, 1)
    })

    it('caches per user', async function () {
      const app = createMockApp({ users: USERS })
      const mixin = new ObjectVisibility(app)

      await mixin.getObjectFilterForUser('user-1')
      await mixin.getObjectFilterForUser('user-2')

      assert.equal(app.calls.getPermissionsForUser, 2)
    })

    it('recomputes after the cache has been cleared', async function () {
      const app = createMockApp({ users: USERS })
      const mixin = new ObjectVisibility(app)

      await mixin.getObjectFilterForUser('user-1')
      mixin.clearObjectFilterCache()
      await mixin.getObjectFilterForUser('user-1')

      assert.equal(app.calls.getPermissionsForUser, 2)
    })

    it('picks up an ACL granted after the first call', async function () {
      const permissionsByUser = { 'user-1': {} }
      const app = createMockApp({ users: USERS, permissionsByUser })
      const mixin = new ObjectVisibility(app)

      assert.equal((await mixin.getObjectFilterForUser('user-1'))('vm-1'), false)

      permissionsByUser['user-1'] = { 'vm-1': { view: 1 } }
      mixin.clearObjectFilterCache()

      assert.equal((await mixin.getObjectFilterForUser('user-1'))('vm-1'), true)
    })

    it('clears a single user without dropping the others', async function () {
      const app = createMockApp({ users: USERS })
      const mixin = new ObjectVisibility(app)

      await mixin.getObjectFilterForUser('user-1')
      await mixin.getObjectFilterForUser('user-2')
      mixin.clearObjectFilterCache('user-1')
      await mixin.getObjectFilterForUser('user-1')
      await mixin.getObjectFilterForUser('user-2')

      assert.equal(app.calls.getPermissionsForUser, 3)
    })
  })

  // The event stream only carries changes, so a client whose permissions grew
  // would never hear about objects that already existed.
  describe('resync on a permission change', () => {
    it('pushes the newly visible objects to a non-admin', async () => {
      const permissionsByUser = { 'user-1': {} }
      const connection = createMockConnection('user-1')
      const app = createMockApp({ users: USERS, permissionsByUser, connections: [connection] })
      const mixin = new ObjectVisibility(app)

      await mixin.getObjectFilterForUser('user-1')

      permissionsByUser['user-1'] = { 'vm-1': { view: 1 } }
      await mixin.clearObjectFilterCache('user-1')

      assert.equal(connection.notified.length, 1)
      assert.deepEqual(Object.keys(connection.notified[0].params.items), ['vm-1'])
    })

    // A client promoted to admin stops filtering locally, so it must be given
    // everything it was previously denied — otherwise it shows a near-empty XO
    // until the page is reloaded.
    it('pushes the whole collection to a user who has just become an admin', async () => {
      const users = { 'user-1': { id: 'user-1', permission: 'none' } }
      const connection = createMockConnection('user-1')
      const app = createMockApp({ users, connections: [connection] })
      const mixin = new ObjectVisibility(app)

      await mixin.getObjectFilterForUser('user-1')

      users['user-1'] = { id: 'user-1', permission: 'admin' }
      await mixin.clearObjectFilterCache('user-1')

      assert.equal(connection.notified.length, 1)
      assert.deepEqual(Object.keys(connection.notified[0].params.items).sort(), Object.keys(OBJECTS).sort())
    })

    // With an external auth provider the user record is written on every
    // sign-in: an admin who was never filtered must not be sent the whole
    // collection each time they log in.
    it('pushes nothing to an admin who was never filtered', async () => {
      const connection = createMockConnection('admin-1')
      const app = createMockApp({ users: USERS, connections: [connection] })
      const mixin = new ObjectVisibility(app)

      await mixin.getObjectFilterForUser('admin-1')
      await mixin.clearObjectFilterCache('admin-1')

      assert.deepEqual(connection.notified, [])
    })

    it('leaves the connections of other users alone', async () => {
      const connection = createMockConnection('user-2')
      const app = createMockApp({
        users: USERS,
        permissionsByUser: { 'user-2': { 'vm-1': { view: 1 } } },
        connections: [connection],
      })
      const mixin = new ObjectVisibility(app)

      await mixin.clearObjectFilterCache('user-1')

      assert.deepEqual(connection.notified, [])
    })
  })

  // An ACL or resource set change invalidates everyone, but concerns almost
  // nobody: without this, one grant rebuilds and re-sends the whole visible
  // set of every connected client.
  describe('resync of users whose permissions did not move', function () {
    it('pushes nothing to a user whose permissions are unchanged', async function () {
      const connection = createMockConnection('user-1')
      const app = createMockApp({
        users: USERS,
        permissionsByUser: { 'user-1': { 'vm-1': { view: 1 } } },
        connections: [connection],
      })
      const mixin = new ObjectVisibility(app)

      await mixin.getObjectFilterForUser('user-1')
      await mixin.clearObjectFilterCache()

      assert.deepEqual(connection.notified, [])
    })

    it('still pushes to the user whose permissions did move', async function () {
      const permissionsByUser = { 'user-1': {} }
      const connection = createMockConnection('user-1')
      const app = createMockApp({ users: USERS, permissionsByUser, connections: [connection] })
      const mixin = new ObjectVisibility(app)

      await mixin.getObjectFilterForUser('user-1')

      permissionsByUser['user-1'] = { 'vm-1': { view: 1 } }
      await mixin.clearObjectFilterCache()

      assert.equal(connection.notified.length, 1)
    })

    it('pushes when nothing is known about the previous state', async function () {
      const connection = createMockConnection('user-1')
      const app = createMockApp({
        users: USERS,
        permissionsByUser: { 'user-1': { 'vm-1': { view: 1 } } },
        connections: [connection],
      })
      const mixin = new ObjectVisibility(app)

      // never looked at before: withholding would be the riskier guess
      await mixin.clearObjectFilterCache()

      assert.equal(connection.notified.length, 1)
    })

    it('ignores the order resource set objects come back in', async function () {
      const resourceSetsByUser = { 'user-1': [{ id: 'rs-1', objects: ['tpl-1', 'vm-1'] }] }
      const connection = createMockConnection('user-1')
      const app = createMockApp({ users: USERS, resourceSetsByUser, connections: [connection] })
      const mixin = new ObjectVisibility(app)

      await mixin.getObjectFilterForUser('user-1')

      resourceSetsByUser['user-1'] = [{ id: 'rs-1', objects: ['vm-1', 'tpl-1'] }]
      await mixin.clearObjectFilterCache()

      assert.deepEqual(connection.notified, [])
    })
  })

  // ACLs are written in loops: creating a VM in a resource set grants one per
  // subject, and each write would otherwise resync on its own.
  describe('debouncing', function () {
    it('collapses a burst of invalidations into a single resync', async function () {
      const permissionsByUser = { 'user-1': {} }
      const connection = createMockConnection('user-1')
      const app = createMockApp({ users: USERS, permissionsByUser, connections: [connection] })
      const mixin = new ObjectVisibility(app)

      await mixin.getObjectFilterForUser('user-1')

      permissionsByUser['user-1'] = { 'vm-1': { view: 1 } }
      const resyncs = [mixin.clearObjectFilterCache(), mixin.clearObjectFilterCache(), mixin.clearObjectFilterCache()]
      await Promise.all(resyncs)

      assert.equal(connection.notified.length, 1)
    })

    // the comparison must be made against the state before the burst started,
    // not against the state left by its first invalidation
    it('compares against the state from before the burst', async function () {
      const permissionsByUser = { 'user-1': { 'vm-1': { view: 1 } } }
      const connection = createMockConnection('user-1')
      const app = createMockApp({ users: USERS, permissionsByUser, connections: [connection] })
      const mixin = new ObjectVisibility(app)

      await mixin.getObjectFilterForUser('user-1')

      const first = mixin.clearObjectFilterCache()
      permissionsByUser['user-1'] = { 'vm-2': { view: 1 } }
      await Promise.all([first, mixin.clearObjectFilterCache()])

      assert.equal(connection.notified.length, 1)
    })
  })

  describe('robustness', function () {
    // `getUser` is uncached and hits Redis: on the notification path that
    // would put a round trip between every batch and its clients
    it('reads the user record once across several calls', async function () {
      const app = createMockApp({ users: USERS })
      const mixin = new ObjectVisibility(app)

      await mixin.getObjectFilterForUser('user-1')
      await mixin.getObjectFilterForUser('user-1')
      await mixin.getObjectFilterForUser('user-1')

      assert.equal(app.calls.getUser, 1)
    })

    it('reads the user record again once the cache is cleared', async function () {
      const app = createMockApp({ users: USERS })
      const mixin = new ObjectVisibility(app)

      await mixin.getObjectFilterForUser('user-1')
      await mixin.clearObjectFilterCache('user-1')
      await mixin.getObjectFilterForUser('user-1')

      assert.equal(app.calls.getUser, 2)
    })

    it('does not read the ACLs of an admin, even once', async function () {
      const app = createMockApp({ users: USERS })
      const mixin = new ObjectVisibility(app)

      await mixin.getObjectFilterForUser('admin-1')
      await mixin.getObjectFilterForUser('admin-1')

      assert.equal(app.calls.getUser, 1)
      assert.equal(app.calls.getPermissionsForUser, 0)
    })

    // one unreadable user — a deleted account still holding a socket — must
    // not stop every other connection from being resynced
    it('resyncs the other connections when one user cannot be read', async function () {
      const permissionsByUser = { 'user-2': {} }
      const broken = createMockConnection('ghost')
      const healthy = createMockConnection('user-2')
      const app = createMockApp({ users: USERS, permissionsByUser, connections: [broken, healthy] })
      const mixin = new ObjectVisibility(app)

      await mixin.getObjectFilterForUser('user-2')

      permissionsByUser['user-2'] = { 'vm-1': { view: 1 } }
      await mixin.clearObjectFilterCache()

      assert.deepEqual(broken.notified, [])
      assert.equal(healthy.notified.length, 1, 'the healthy connection was skipped')
    })
  })
})
