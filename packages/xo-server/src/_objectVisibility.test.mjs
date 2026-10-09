import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createIsObjectVisible } from './_objectVisibility.mjs'

// ===================================================================

// A minimal but realistic XO object graph, shaped like the output of
// `xapi-object-to-xo.mjs`:
//
//   pool-1
//   ├── host-1
//   │   ├── vm-1 ── vbd-1 ── vdi-1 (on sr-1)
//   │   │        └─ vif-1 (on net-1)
//   │   └── vm-2
//   │   └── pgpu-1          (type unknown to xo-acl-resolver)
//   ├── sr-1
//   ├── net-1
//   └── tpl-1
const OBJECTS = {
  'pool-1': { id: 'pool-1', type: 'pool' },
  'host-1': { id: 'host-1', type: 'host', $pool: 'pool-1' },
  'vm-1': { id: 'vm-1', type: 'VM', $container: 'host-1', $pool: 'pool-1', $VBDs: ['vbd-1'] },
  'vm-2': { id: 'vm-2', type: 'VM', $container: 'host-1', $pool: 'pool-1', $VBDs: [] },
  'sr-1': { id: 'sr-1', type: 'SR', $container: 'pool-1', $pool: 'pool-1' },
  'vdi-1': { id: 'vdi-1', type: 'VDI', $SR: 'sr-1', $VBDs: ['vbd-1'] },
  // same XAPI object as a VDI, only not handled by the SM
  'vdi-u': { id: 'vdi-u', type: 'VDI-unmanaged', $SR: 'sr-1', $VBDs: [] },
  'vdi-u-vm': { id: 'vdi-u-vm', type: 'VDI-unmanaged', $SR: 'sr-other', $VBDs: ['vbd-1'] },
  // a disk whose VBD link dangles, as happens mid-update
  'vdi-dangling': { id: 'vdi-dangling', type: 'VDI', $SR: 'sr-other', $VBDs: ['vbd-gone'] },
  'vbd-1': { id: 'vbd-1', type: 'VBD', VDI: 'vdi-1', VM: 'vm-1' },
  'net-1': { id: 'net-1', type: 'network', $pool: 'pool-1' },
  'vif-1': { id: 'vif-1', type: 'VIF', $network: 'net-1', $VM: 'vm-1' },
  'tpl-1': { id: 'tpl-1', type: 'VM-template', $pool: 'pool-1' },
  'pgpu-1': { id: 'pgpu-1', type: 'PGPU', $host: 'host-1' },
}

const view = (...ids) => {
  const permissions = { __proto__: null }
  for (const id of ids) {
    permissions[id] = { view: 1 }
  }
  return permissions
}

const makeIsVisible = ({ permissionsByObject = {}, resourceSetObjectIds = [], getObject } = {}) =>
  createIsObjectVisible({
    getObject: getObject ?? (id => OBJECTS[id]),
    permissionsByObject,
    resourceSetObjectIds,
  })

// ===================================================================

describe('createIsObjectVisible', function () {
  describe('ACL-derived visibility', function () {
    it('hides everything from a user without any ACL', function () {
      const isVisible = makeIsVisible()

      for (const id of Object.keys(OBJECTS)) {
        assert.equal(isVisible(id), false, `${id} should not be visible`)
      }
    })

    it('grants access to an explicitly granted object', function () {
      const isVisible = makeIsVisible({ permissionsByObject: view('vm-1') })

      assert.equal(isVisible('vm-1'), true)
      assert.equal(isVisible('vm-2'), false)
    })

    it('inherits access from the container', function () {
      const isVisible = makeIsVisible({ permissionsByObject: view('pool-1') })

      for (const id of ['pool-1', 'host-1', 'vm-1', 'vm-2', 'sr-1', 'net-1', 'tpl-1']) {
        assert.equal(isVisible(id), true, `${id} should be visible`)
      }
    })

    it('resolves a VDI through the SR holding it', function () {
      const isVisible = makeIsVisible({ permissionsByObject: view('sr-1') })

      assert.equal(isVisible('vdi-1'), true)
    })

    it('resolves a VDI through a VM it is attached to', function () {
      const isVisible = makeIsVisible({ permissionsByObject: view('vm-1') })

      assert.equal(isVisible('vdi-1'), true)
    })

    it('resolves a VIF through its network or its VM', function () {
      assert.equal(makeIsVisible({ permissionsByObject: view('net-1') })('vif-1'), true)
      assert.equal(makeIsVisible({ permissionsByObject: view('vm-1') })('vif-1'), true)
    })

    it('resolves an unmanaged VDI through its SR, like any other disk', function () {
      const isVisible = makeIsVisible({ permissionsByObject: view('sr-1') })

      assert.equal(isVisible('vdi-u'), true)
    })

    it('resolves an unmanaged VDI through a VM it is attached to', function () {
      const isVisible = makeIsVisible({ permissionsByObject: view('vm-1') })

      assert.equal(isVisible('vdi-u-vm'), true)
    })

    // `getObject` returns undefined for an unknown id on the server, where it
    // used to return an empty object in the client: dereferencing it blindly
    // would throw on the hot path
    it('does not throw when a VBD link dangles', function () {
      const isVisible = makeIsVisible({ permissionsByObject: view('vm-1') })

      assert.equal(isVisible('vdi-dangling'), false)
    })

    it('does not expose a VM through the SR holding its disks', function () {
      const isVisible = makeIsVisible({ permissionsByObject: view('sr-1') })

      assert.equal(isVisible('vm-1'), false)
      assert.equal(isVisible('vm-2'), false)
    })

    it('hides object types the resolver does not know about', function () {
      const isVisible = makeIsVisible({ permissionsByObject: view('host-1') })

      assert.equal(isVisible('host-1'), true)
      assert.equal(isVisible('pgpu-1'), false)
    })

    it('returns false for an unknown id instead of throwing', function () {
      const isVisible = makeIsVisible({ permissionsByObject: view('pool-1') })

      assert.equal(isVisible('does-not-exist'), false)
    })
  })

  describe('resource set visibility', function () {
    it('grants access to the objects of the resource sets the user is a subject of', function () {
      const isVisible = makeIsVisible({ resourceSetObjectIds: ['tpl-1', 'sr-1', 'net-1'] })

      assert.equal(isVisible('tpl-1'), true)
      assert.equal(isVisible('sr-1'), true)
      assert.equal(isVisible('net-1'), true)
    })

    it('resolves the VDIs of a resource set SR, as the ISO picker needs them', function () {
      const isVisible = makeIsVisible({ resourceSetObjectIds: ['sr-1'] })

      assert.equal(isVisible('vdi-1'), true)
    })

    it('does not expose other users VMs through a shared resource set SR', function () {
      const isVisible = makeIsVisible({ resourceSetObjectIds: ['sr-1'] })

      assert.equal(isVisible('vm-1'), false)
      assert.equal(isVisible('vm-2'), false)
    })

    it('combines ACLs and resource sets', function () {
      const isVisible = makeIsVisible({
        permissionsByObject: view('vm-1'),
        resourceSetObjectIds: ['tpl-1'],
      })

      assert.equal(isVisible('vm-1'), true)
      assert.equal(isVisible('tpl-1'), true)
      assert.equal(isVisible('vm-2'), false)
    })

    it('does not mutate the permissions it was given', function () {
      const permissionsByObject = view('vm-1')
      makeIsVisible({ permissionsByObject, resourceSetObjectIds: ['tpl-1'] })('tpl-1')

      assert.deepEqual(Object.keys(permissionsByObject), ['vm-1'])
    })
  })

  describe('caching', function () {
    it('resolves a given id only once', function () {
      let nCalls = 0
      const isVisible = makeIsVisible({
        permissionsByObject: view('pool-1'),
        getObject: id => {
          nCalls++
          return OBJECTS[id]
        },
      })

      assert.equal(isVisible('vm-1'), true)
      const nCallsAfterFirstLookup = nCalls

      assert.equal(isVisible('vm-1'), true)
      assert.equal(nCalls, nCallsAfterFirstLookup)
    })
  })
})
