import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { Writable } from 'node:stream'

import * as handlers from './xo.mjs'

// ===================================================================

const OBJECTS = {
  'vm-1': { id: 'vm-1', type: 'VM', $pool: 'pool-1' },
  'vm-2': { id: 'vm-2', type: 'VM', $pool: 'pool-1' },
  'sr-1': { id: 'sr-1', type: 'SR', $pool: 'pool-1' },
}

// Minimal XoApp mock: `getObjects` behaves like `Xo#getObjects`, and
// `getObjectFilterForUser` is the only source of truth for visibility
const createMockApp = ({ user, permission, isObjectVisible }) => ({
  apiContext: { user, permission },
  getObjectFilterForUser: async () => isObjectVisible,
  getObjects: ({ filter, limit = Infinity } = {}) => {
    const results = { __proto__: null }
    for (const id of Object.keys(OBJECTS)) {
      const object = OBJECTS[id]
      if ((filter === undefined || filter(object, id, OBJECTS)) && limit-- > 0) {
        results[id] = object
      }
    }
    return results
  },
  registerHttpRequest: async (fn, data) => {
    // expose what the HTTP handler was registered with so the ndjson path can
    // be exercised without an actual HTTP round-trip
    registered = { fn, data }
    return '/api/token'
  },
})

let registered

const ADMIN = { id: 'admin-1' }
const USER = { id: 'user-1' }

// ===================================================================

describe('xo.getAllObjects', function () {
  it('returns every object to an admin', async function () {
    const app = createMockApp({ user: ADMIN, permission: 'admin', isObjectVisible: undefined })

    const result = await handlers.getAllObjects.call(app, {})

    assert.deepEqual(Object.keys(result).sort(), ['sr-1', 'vm-1', 'vm-2'])
  })

  // the core of the issue: a user with no ACL used to receive the whole
  // infrastructure and was expected to filter it client-side
  it('returns nothing to a user who may not see any object', async function () {
    const app = createMockApp({ user: USER, permission: 'none', isObjectVisible: () => false })

    const result = await handlers.getAllObjects.call(app, {})

    assert.deepEqual(Object.keys(result), [])
  })

  it('returns only the objects the user may see', async function () {
    const app = createMockApp({ user: USER, permission: 'none', isObjectVisible: id => id === 'vm-1' })

    const result = await handlers.getAllObjects.call(app, {})

    assert.deepEqual(Object.keys(result), ['vm-1'])
  })

  it('applies the caller filter on top of the visibility filter', async function () {
    const app = createMockApp({ user: USER, permission: 'none', isObjectVisible: id => id === 'vm-1' })

    const result = await handlers.getAllObjects.call(app, { filter: 'type:VM' })

    assert.deepEqual(Object.keys(result), ['vm-1'])
  })

  // `limit` must count what the user actually receives, otherwise the number of
  // returned objects leaks how many they are not allowed to see
  it('counts the limit against the visible objects only', async function () {
    const app = createMockApp({ user: USER, permission: 'none', isObjectVisible: id => id === 'sr-1' })

    const result = await handlers.getAllObjects.call(app, { limit: 1 })

    assert.deepEqual(Object.keys(result), ['sr-1'])
  })

  describe('ndjson', function () {
    it('filters the streamed objects too', async function () {
      const app = createMockApp({ user: USER, permission: 'none', isObjectVisible: id => id === 'vm-2' })

      registered = undefined
      const { $getFrom } = await handlers.getAllObjects.call(app, { ndjson: true })
      assert.equal(typeof $getFrom, 'string')

      // a real writable, so the stream pipeline behaves as in production
      const chunks = []
      const res = new Writable({
        write(chunk, _encoding, callback) {
          chunks.push(String(chunk))
          callback()
        },
      })
      res.set = () => {}

      await registered.fn.call(app, {}, res, registered.data)

      const ids = chunks
        .join('')
        .split('\n')
        .filter(line => line !== '')
        .map(line => JSON.parse(line).id)

      assert.deepEqual(ids, ['vm-2'])
    })
  })
})
