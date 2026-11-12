import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { forbiddenOperation } from 'xo-common/api-errors.js'

import * as handlers from './vm.mjs'
import ReservedTags from '../xo-mixins/reserved-tags.mjs'

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
    async stripInheritedReservedTagsOrDestroy(...args) {
      events.push(['stripInheritedReservedTagsOrDestroy', ...args])
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
  const sr = { $pool: 'pool-1', _xapiId: 'sr-1' }

  it('strips the reserved tags the user may not add from the copy, before returning it', async () => {
    const { app, events, newVm } = createApp()
    assert.equal(await handlers.copy.call(app, { vm, sr }), 'new-vm')
    assert.deepEqual(events[0], ['stripInheritedReservedTagsOrDestroy', USER, newVm])
  })

  it('fails and destroys the copy with its disks if its reserved tags cannot be stripped', async () => {
    const error = new Error('XAPI is down')
    const { app, events, newVm } = createApp()
    newVm.$xapi = { VM_destroy: async (...args) => events.push(['VM_destroy', ...args]) }
    const mixin = new ReservedTags(app)
    mixin.stripInheritedReservedTags = async () => {
      throw error
    }
    app.stripInheritedReservedTagsOrDestroy = mixin.stripInheritedReservedTagsOrDestroy.bind(mixin)

    await assert.rejects(handlers.copy.call(app, { vm, sr }), error)
    assert.deepEqual(events, [['VM_destroy', 'OpaqueRef:new-vm', { deleteDisks: true, force: true }]])
  })
})

describe('vm.copyToTemplate', () => {
  it('strips the reserved tags the user may not add, then makes the copy a template', async () => {
    const { app, events, newVm } = createApp()
    await handlers.copyToTemplate.call(app, { vm })
    assert.deepEqual(events, [
      ['stripInheritedReservedTags', USER, newVm],
      ['set_is_a_template', true],
    ])
  })

  it('fails and destroys the copy with its disks if its reserved tags cannot be stripped', async () => {
    const error = new Error('XAPI is down')
    const { app, events } = createApp({
      strip: async () => {
        throw error
      },
    })
    await assert.rejects(handlers.copyToTemplate.call(app, { vm }), error)
    // VM_destroy deletes the disks unless told not to; the raw $destroy() left them
    assert.deepEqual(events.at(-1), ['VM_destroy', 'OpaqueRef:new-vm'])
  })
})

describe('vm.create', () => {
  const TEMPLATE = {
    id: 'tpl-1',
    $pool: 'pool-1',
    _xapiId: 'tpl-1',
    CPUs: { number: 1 },
    memory: { dynamic: [0, 1024] },
    tags: ['keep', 'vdf:role=e2e', 'vdf:quarantine'],
  }

  // an app with the reserved tags mixin, a resource set without tags, and a
  // XAPI recording the tags the new VM is created with
  function createAppForCreate(user) {
    const created = []
    const newVm = { $id: 'new-vm', $ref: 'OpaqueRef:new-vm', $VIFs: [], tags: undefined }
    const xapi = {
      getObject: () => ({ $VBDs: [] }),
      async createVm(templateId, params) {
        created.push(params.tags)
        newVm.tags = params.tags
        return newVm
      },
      xo: { addObject: () => ({ id: 'new-vm' }), setData: async () => {} },
    }
    const app = {
      apiContext: { user, permission: user.permission },
      addAcl: async () => {},
      allocateLimitsInResourceSet: async () => {},
      checkPermissions: async () => {},
      checkResourceSetConstraints: async () => {},
      getResourceSet: async () => ({ subjects: [], tags: [] }),
      getXapi: () => xapi,
      hasPermissions: async () => false,
    }
    const mixin = new ReservedTags(app)
    app.checkNewVmTags = mixin.checkNewVmTags.bind(mixin)
    app.stripInheritedReservedTags = async (user, vm, inherited) => {
      created.push(['strip', inherited])
      return []
    }
    return { app, created }
  }

  it('keeps the template vdf:quarantine when tags are omitted, in a resource set', async () => {
    const { app, created } = createAppForCreate(USER)
    await handlers.create.call(app, { template: TEMPLATE, resourceSet: 'rs-1', VIFs: [], name_label: 'vm' })
    assert.deepEqual(created, [['vdf:quarantine'], ['strip', TEMPLATE.tags]])
  })

  it('refuses tags that remove the template vdf:quarantine to a user without the right, before creating', async () => {
    const { app, created } = createAppForCreate(USER)
    await assert.rejects(
      handlers.create.call(app, { template: TEMPLATE, resourceSet: 'rs-1', VIFs: [], tags: ['keep'] }),
      forbiddenOperation.is
    )
    assert.deepEqual(created, [])
  })

  it('lets an XO administrator remove it', async () => {
    const { app, created } = createAppForCreate({ id: 'admin', permission: 'admin' })
    await handlers.create.call(app, { template: TEMPLATE, resourceSet: 'rs-1', VIFs: [], tags: ['keep'] })
    assert.deepEqual(created[0], ['keep'])
  })
})

describe('vm.migrate', () => {
  const TAGGED_VM = { $pool: 'pool-1', tags: ['vdf:role=app'], _xapiId: 'vm-1' }
  const HOST_IN_POOL_2 = { $pool: 'pool-2', _xapiId: 'host-2' }

  // an app with the reserved tags mixin, where the user has administrate on
  // `administratedPool` only, and a XAPI recording the migrations
  function createAppForMigrate(administratedPool) {
    const migrations = []
    const xapi = { migrateVm: async (...args) => migrations.push(args) }
    const app = {
      apiContext: { user: USER, permission: USER.permission },
      checkPermissions: async () => {},
      getXapi: () => xapi,
      hasPermissions: async (userId, [[id, permission]]) => id === administratedPool && permission === 'administrate',
    }
    const mixin = new ReservedTags(app)
    app.checkMigration = mixin.checkMigration.bind(mixin)
    return { app, migrations }
  }

  it('refuses to move a VM with group tags to a pool the user does not administrate, before migrating', async () => {
    const { app, migrations } = createAppForMigrate('pool-1')
    await assert.rejects(
      handlers.migrate.call(app, { vm: TAGGED_VM, host: HOST_IN_POOL_2 }),
      error => forbiddenOperation.is(error) && error.data.reason.startsWith('the VM carries firewall tags')
    )
    assert.deepEqual(migrations, [])
  })

  it('migrates it with administrate on the destination pool', async () => {
    const { app, migrations } = createAppForMigrate('pool-2')
    await handlers.migrate.call(app, { vm: TAGGED_VM, host: HOST_IN_POOL_2 })
    assert.equal(migrations.length, 1)
  })
})
