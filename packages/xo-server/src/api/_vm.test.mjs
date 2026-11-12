import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import * as handlers from './vm.mjs'

const USER = { id: 'user-1', permission: 'none' }

// an app whose XAPI clones and copies VMs, recording in order what happens to the new VM
function createApp({ strip = async () => [] } = {}) {
  const events = []
  const newVm = {
    $id: 'new-vm',
    $ref: 'OpaqueRef:new-vm',
    set_is_a_template: async value => events.push(['set_is_a_template', value]),
  }
  const xapi = {
    cloneVm: async () => newVm,
    copyVm: async () => newVm,
    VM_destroy: async ref => events.push(['VM_destroy', ref]),
  }
  const app = {
    apiContext: { user: USER, permission: 'none' },
    addAcl: async () => {},
    checkPermissions: async () => {},
    getXapi: () => xapi,
    async stripInheritedReservedTags(...args) {
      events.push(['stripInheritedReservedTags', ...args])
      return strip()
    },
  }
  return { app, events, newVm }
}

const vm = { $pool: 'pool-1', $VBDs: [], type: 'VM', _xapiId: 'vm-1', _xapiRef: 'OpaqueRef:vm-1' }

describe('vm.clone', () => {
  it('strips the reserved tags the user may not add from the clone, before returning it', async () => {
    const { app, events, newVm } = createApp()
    assert.equal(await handlers.clone.call(app, { vm, name: 'clone' }), 'new-vm')
    assert.deepEqual(events[0], ['stripInheritedReservedTags', USER, newVm])
  })

  it('fails and destroys the clone if its reserved tags cannot be stripped', async () => {
    const error = new Error('XAPI is down')
    const { app, events } = createApp({
      strip: async () => {
        throw error
      },
    })
    await assert.rejects(handlers.clone.call(app, { vm, name: 'clone' }), error)
    assert.deepEqual(events.at(-1), ['VM_destroy', 'OpaqueRef:new-vm'])
  })
})

describe('vm.copy', () => {
  it('strips the reserved tags the user may not add from the copy, before returning it', async () => {
    const { app, events, newVm } = createApp()
    const sr = { $pool: 'pool-1', _xapiId: 'sr-1' }
    assert.equal(await handlers.copy.call(app, { vm, sr }), 'new-vm')
    assert.deepEqual(events[0], ['stripInheritedReservedTags', USER, newVm])
  })
})
