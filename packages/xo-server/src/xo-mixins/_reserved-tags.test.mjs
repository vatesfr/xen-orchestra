import assert from 'node:assert/strict'
import aclResolver from 'xo-acl-resolver'
import { EventEmitter } from 'node:events'
import { describe, it } from 'node:test'
import { forbiddenOperation } from 'xo-common/api-errors.js'

import ReservedTags, { diffTags, isReservedTag, RESERVED_TAG_CHANGE_EVENT } from './reserved-tags.mjs'

const OBJECTS = {
  'pool-1': { id: 'pool-1', type: 'pool', $pool: 'pool-1' },
  'pool-2': { id: 'pool-2', type: 'pool', $pool: 'pool-2' },
  'vm-1': { id: 'vm-1', type: 'VM', $container: 'pool-1', $pool: 'pool-1' },
}
const VM = OBJECTS['vm-1']

const ADMIN = { id: 'admin', permission: 'admin' }
const POOL_ADMIN = { id: 'pool-admin', permission: 'none' }
const VM_ADMIN = { id: 'vm-admin', permission: 'none' }
const POOL_2_ADMIN = { id: 'pool-2-admin', permission: 'none' }

// the legacy ACLs of each user, as `getPermissionsForUser` returns them
const PERMISSIONS_BY_USER = {
  [POOL_ADMIN.id]: { 'pool-1': { administrate: 1 } },
  [VM_ADMIN.id]: { 'vm-1': { administrate: 1 } },
  [POOL_2_ADMIN.id]: { 'pool-2': { administrate: 1 } },
}

// `hasPermissions` as the ACLs mixin implements it, counting its calls; the
// app's hooks and objects (XO's object collection) as event emitters
function createMixin() {
  const app = Object.assign(new EventEmitter(), {
    hooks: new EventEmitter(),
    objects: new EventEmitter(),
    hasPermissionsCalls: 0,
    async hasPermissions(userId, permissions) {
      this.hasPermissionsCalls++
      return aclResolver.check(PERMISSIONS_BY_USER[userId] ?? {}, id => OBJECTS[id], permissions)
    },
  })
  return { app, mixin: new ReservedTags(app) }
}

const isRefusal = tag => error =>
  forbiddenOperation.is(error) && error.data.reason.startsWith(`the tag "${tag}" belongs to the firewall`)

describe('isReservedTag', () => {
  it('reserves the vdf: prefix only', () => {
    assert.equal(isReservedTag('vdf:quarantine'), true)
    assert.equal(isReservedTag('vdf:role=app'), true)
    assert.equal(isReservedTag('vdf'), false)
    assert.equal(isReservedTag('web'), false)
    assert.equal(isReservedTag('xo:no-bak'), false)
  })
})

describe('diffTags', () => {
  it('returns the tags added and removed', () => {
    assert.deepEqual(diffTags(['a', 'vdf:quarantine'], ['a', 'b']), { added: ['b'], removed: ['vdf:quarantine'] })
    assert.deepEqual(diffTags(['vdf:role=app', 'a'], ['a', 'vdf:role=app']), { added: [], removed: [] })
  })
})

describe('checkTagsChange', () => {
  it('lets an XO administrator write reserved tags', async () => {
    const { app, mixin } = createMixin()
    await mixin.checkTagsChange(ADMIN, VM, { added: ['vdf:role=app'], removed: ['vdf:quarantine'] })
    assert.equal(app.hasPermissionsCalls, 0)
  })

  it('lets a user with administrate on the pool write reserved tags', async () => {
    const { mixin } = createMixin()
    await mixin.checkTagsChange(POOL_ADMIN, VM, { added: ['vdf:role=app'] })
    await mixin.checkTagsChange(POOL_ADMIN, VM, { removed: ['vdf:quarantine'] })
  })

  it('refuses a user with administrate on the VM only', async () => {
    const { mixin } = createMixin()
    await assert.rejects(mixin.checkTagsChange(VM_ADMIN, VM, { added: ['vdf:role=app'] }), isRefusal('vdf:role=app'))
    await assert.rejects(
      mixin.checkTagsChange(VM_ADMIN, VM, { removed: ['vdf:quarantine'] }),
      isRefusal('vdf:quarantine')
    )
  })

  it('never checks tags that are not reserved', async () => {
    const { app, mixin } = createMixin()
    await mixin.checkTagsChange(VM_ADMIN, VM, { added: ['web'], removed: ['vdf'] })
    assert.equal(app.hasPermissionsCalls, 0)
  })

  it('does not check calls without a user', async () => {
    const { app, mixin } = createMixin()
    await mixin.checkTagsChange(undefined, VM, { removed: ['vdf:quarantine'] })
    assert.equal(app.hasPermissionsCalls, 0)
  })

  it('allows replacing the tags when the reserved ones are unchanged', async () => {
    const { app, mixin } = createMixin()
    const change = mixin.diffTags(['vdf:quarantine', 'vdf:role=app', 'old'], ['new', 'vdf:role=app', 'vdf:quarantine'])
    await mixin.checkTagsChange(VM_ADMIN, VM, change)
    assert.equal(app.hasPermissionsCalls, 0)
  })

  it('refuses replacing the tags when it drops vdf:quarantine', async () => {
    const { mixin } = createMixin()
    const change = mixin.diffTags(['vdf:quarantine', 'old'], ['old', 'new'])
    await assert.rejects(mixin.checkTagsChange(VM_ADMIN, VM, change), isRefusal('vdf:quarantine'))
  })
})

describe('checkNewVmTags', () => {
  const TEMPLATE = {
    id: 'tpl-1',
    type: 'VM-template',
    $pool: 'pool-1',
    tags: ['keep', 'vdf:role=e2e', 'vdf:quarantine'],
  }

  it("keeps vdf:quarantine when tags are omitted, whoever the user is, even replaced by the resource set's", async () => {
    const { app, mixin } = createMixin()
    assert.deepEqual(await mixin.checkNewVmTags(VM_ADMIN, TEMPLATE, undefined, []), ['vdf:quarantine'])
    assert.deepEqual(await mixin.checkNewVmTags(VM_ADMIN, TEMPLATE, undefined, ['rs']), ['rs', 'vdf:quarantine'])
    assert.deepEqual(await mixin.checkNewVmTags(VM_ADMIN, TEMPLATE, undefined, ['vdf:quarantine']), ['vdf:quarantine'])
    assert.equal(app.hasPermissionsCalls, 0)
  })

  it("keeps the template's tags when tags are omitted without a resource set", async () => {
    const { app, mixin } = createMixin()
    assert.deepEqual(await mixin.checkNewVmTags(VM_ADMIN, TEMPLATE, undefined, undefined), TEMPLATE.tags)
    assert.equal(app.hasPermissionsCalls, 0)
  })

  it('refuses tags without vdf:quarantine to a user without the right: an explicit removal', async () => {
    const { mixin } = createMixin()
    await assert.rejects(mixin.checkNewVmTags(VM_ADMIN, TEMPLATE, ['keep'], undefined), isRefusal('vdf:quarantine'))
    await assert.rejects(mixin.checkNewVmTags(VM_ADMIN, TEMPLATE, ['keep'], ['rs']), isRefusal('vdf:quarantine'))
  })

  it('lets an XO administrator or a user with administrate on the pool remove vdf:quarantine', async () => {
    const { mixin } = createMixin()
    assert.deepEqual(await mixin.checkNewVmTags(ADMIN, TEMPLATE, ['keep'], undefined), ['keep'])
    assert.deepEqual(await mixin.checkNewVmTags(POOL_ADMIN, TEMPLATE, ['keep'], ['rs']), ['keep', 'rs'])
  })

  it("lets tags leave out the template's group tags without any check", async () => {
    const { app, mixin } = createMixin()
    assert.deepEqual(await mixin.checkNewVmTags(VM_ADMIN, TEMPLATE, ['vdf:quarantine', 'new'], undefined), [
      'vdf:quarantine',
      'new',
    ])
    assert.equal(app.hasPermissionsCalls, 0)
  })

  it("does not check the template's reserved tags kept: they are stripped after creation", async () => {
    const { app, mixin } = createMixin()
    assert.deepEqual(await mixin.checkNewVmTags(VM_ADMIN, TEMPLATE, TEMPLATE.tags, undefined), TEMPLATE.tags)
    assert.equal(app.hasPermissionsCalls, 0)
  })

  it("checks the reserved tags added, except the resource set's", async () => {
    const { mixin } = createMixin()
    await assert.rejects(
      mixin.checkNewVmTags(VM_ADMIN, TEMPLATE, ['vdf:quarantine', 'vdf:role=app'], undefined),
      isRefusal('vdf:role=app')
    )
    assert.deepEqual(await mixin.checkNewVmTags(VM_ADMIN, TEMPLATE, ['keep', 'vdf:quarantine'], ['vdf:role=app']), [
      'keep',
      'vdf:quarantine',
      'vdf:role=app',
    ])
    assert.deepEqual(await mixin.checkNewVmTags(POOL_ADMIN, TEMPLATE, ['vdf:quarantine', 'vdf:role=app'], undefined), [
      'vdf:quarantine',
      'vdf:role=app',
    ])
  })

  it('does not check calls without a user', async () => {
    const { app, mixin } = createMixin()
    assert.deepEqual(await mixin.checkNewVmTags(undefined, TEMPLATE, ['vdf:role=app'], undefined), ['vdf:role=app'])
    assert.equal(app.hasPermissionsCalls, 0)
  })
})

describe('checkMigration', () => {
  const TAGGED_VM = { ...VM, tags: ['web', 'vdf:role=app', 'vdf:quarantine'] }

  const isMigrationRefusal = error =>
    forbiddenOperation.is(error) &&
    error.data.reason ===
      'the VM carries firewall tags (vdf:role=app): migrating it to another pool takes an XO administrator or the administrate permission on the destination pool'

  it('lets an XO administrator migrate a VM with group tags to another pool', async () => {
    const { app, mixin } = createMixin()
    await mixin.checkMigration(ADMIN, TAGGED_VM, 'pool-2')
    assert.equal(app.hasPermissionsCalls, 0)
  })

  it('lets a user with administrate on the destination pool migrate it', async () => {
    const { mixin } = createMixin()
    await mixin.checkMigration(POOL_2_ADMIN, TAGGED_VM, 'pool-2')
  })

  it('refuses a user with administrate on the source pool or the VM only', async () => {
    const { mixin } = createMixin()
    await assert.rejects(mixin.checkMigration(POOL_ADMIN, TAGGED_VM, 'pool-2'), isMigrationRefusal)
    await assert.rejects(mixin.checkMigration(VM_ADMIN, TAGGED_VM, 'pool-2'), isMigrationRefusal)
  })

  it('does not check a VM whose only reserved tag is vdf:quarantine, or without any', async () => {
    const { app, mixin } = createMixin()
    await mixin.checkMigration(VM_ADMIN, { ...VM, tags: ['web', 'vdf:quarantine'] }, 'pool-2')
    await mixin.checkMigration(VM_ADMIN, { ...VM, tags: ['web'] }, 'pool-2')
    await mixin.checkMigration(VM_ADMIN, VM, 'pool-2')
    assert.equal(app.hasPermissionsCalls, 0)
  })

  it('does not check a migration within the pool', async () => {
    const { app, mixin } = createMixin()
    await mixin.checkMigration(VM_ADMIN, TAGGED_VM, 'pool-1')
    assert.equal(app.hasPermissionsCalls, 0)
  })

  it('does not check calls without a user', async () => {
    const { app, mixin } = createMixin()
    await mixin.checkMigration(undefined, TAGGED_VM, 'pool-2')
    assert.equal(app.hasPermissionsCalls, 0)
  })
})

// the XAPI record of a VM just created on a pool, recording the tags written on it and its destruction
function createNewVm(tags, { pool = 'pool-1', setTags = async () => {}, destroy = async () => {} } = {}) {
  const vm = {
    uuid: 'new-vm',
    $ref: 'OpaqueRef:new-vm',
    tags,
    tagsWritten: [],
    destroyed: [],
    $xapi: {
      xo: { addObject: vm => ({ id: vm.uuid, type: 'VM', $container: pool, $pool: pool }) },
      async VM_destroy(...args) {
        vm.destroyed.push(args)
        await destroy()
      },
    },
    async set_tags(tags) {
      this.tagsWritten.push(tags)
      await setTags(tags)
      this.tags = tags
    },
  }
  return vm
}

describe('stripInheritedReservedTags', () => {
  const TAGS = ['web', 'vdf:role=app', 'vdf:quarantine', 'vdf:role=db']

  it('lets an XO administrator keep the reserved tags', async () => {
    const { mixin } = createMixin()
    const vm = createNewVm(TAGS)
    assert.deepEqual(await mixin.stripInheritedReservedTags(ADMIN, vm), [])
    assert.deepEqual(vm.tagsWritten, [])
  })

  it('lets a user with administrate on the pool keep the reserved tags', async () => {
    const { mixin } = createMixin()
    const vm = createNewVm(TAGS)
    assert.deepEqual(await mixin.stripInheritedReservedTags(POOL_ADMIN, vm), [])
    assert.deepEqual(vm.tagsWritten, [])
  })

  it('strips the group tags of a user without the right, but keeps vdf:quarantine', async () => {
    const { mixin } = createMixin()
    const vm = createNewVm(TAGS)
    assert.deepEqual(await mixin.stripInheritedReservedTags(VM_ADMIN, vm), ['vdf:role=app', 'vdf:role=db'])
    assert.deepEqual(vm.tagsWritten, [['web', 'vdf:quarantine']])
  })

  it('decides on the pool of the new VM', async () => {
    const { mixin } = createMixin()
    const vm = createNewVm(TAGS, { pool: 'pool-2' })
    assert.deepEqual(await mixin.stripInheritedReservedTags(POOL_ADMIN, vm), ['vdf:role=app', 'vdf:role=db'])
  })

  it('leaves a VM without group tags untouched, without any check or XAPI call', async () => {
    const { app, mixin } = createMixin()
    const vm = createNewVm(['web', 'vdf:quarantine'])
    vm.$xapi = undefined
    assert.deepEqual(await mixin.stripInheritedReservedTags(VM_ADMIN, vm), [])
    assert.deepEqual(vm.tagsWritten, [])
    assert.equal(app.hasPermissionsCalls, 0)
  })

  it('does not check calls without a user', async () => {
    const { app, mixin } = createMixin()
    const vm = createNewVm(TAGS)
    assert.deepEqual(await mixin.stripInheritedReservedTags(undefined, vm), [])
    assert.deepEqual(vm.tagsWritten, [])
    assert.equal(app.hasPermissionsCalls, 0)
  })

  it('only considers the inherited tags when given', async () => {
    const { mixin } = createMixin()
    const vm = createNewVm(TAGS)
    assert.deepEqual(await mixin.stripInheritedReservedTags(VM_ADMIN, vm, ['web', 'vdf:role=db', 'vdf:net=dmz']), [
      'vdf:role=db',
    ])
    assert.deepEqual(vm.tagsWritten, [['web', 'vdf:role=app', 'vdf:quarantine']])
  })

  it('fails when the tags cannot be removed', async () => {
    const { mixin } = createMixin()
    const error = new Error('XAPI is down')
    const vm = createNewVm(TAGS, {
      setTags: async () => {
        throw error
      },
    })
    await assert.rejects(mixin.stripInheritedReservedTags(VM_ADMIN, vm), error)
  })
})

describe('stripInheritedReservedTagsOrDestroy', () => {
  const TAGS = ['web', 'vdf:role=app', 'vdf:quarantine']
  const failing = error => async () => {
    throw error
  }

  it('strips like stripInheritedReservedTags, and keeps the VM', async () => {
    const { mixin } = createMixin()
    const vm = createNewVm(TAGS)
    assert.deepEqual(await mixin.stripInheritedReservedTagsOrDestroy(VM_ADMIN, vm, ['vdf:role=app']), ['vdf:role=app'])
    assert.deepEqual(vm.tagsWritten, [['web', 'vdf:quarantine']])
    assert.deepEqual(vm.destroyed, [])
  })

  it('destroys the VM with its disks when the tags cannot be removed, then fails with the error', async () => {
    const { mixin } = createMixin()
    const error = new Error('XAPI is down')
    const vm = createNewVm(TAGS, { setTags: failing(error) })
    await assert.rejects(mixin.stripInheritedReservedTagsOrDestroy(VM_ADMIN, vm), error)
    assert.deepEqual(vm.destroyed, [['OpaqueRef:new-vm', { deleteDisks: true, force: true }]])
  })

  it('fails with the error of the removal even when the destroy fails', async () => {
    const { mixin } = createMixin()
    const error = new Error('XAPI is down')
    const vm = createNewVm(TAGS, { setTags: failing(error), destroy: failing(new Error('VM is locked')) })
    await assert.rejects(mixin.stripInheritedReservedTagsOrDestroy(VM_ADMIN, vm), error)
    assert.equal(vm.destroyed.length, 1)
  })
})

// XO started, its objects loaded: the reserved tag changes the mixin emits
function createWatching(loaded = [{ ...VM, tags: ['web'] }]) {
  const { app, mixin } = createMixin()
  const events = []
  app.on(RESERVED_TAG_CHANGE_EVENT, event => events.push(event))
  app.hooks.emit('start')
  app.objects.emit('add', Object.fromEntries(loaded.map(object => [object.id, object])))
  // XAPI reports objects as they are now
  const update = (...objects) => app.objects.emit('update', Object.fromEntries(objects.map(o => [o.id, o])))
  return { app, mixin, events, update }
}

describe('reserved tag changes reported by XAPI', () => {
  it('attributes a change the guard let through to its user, once', async () => {
    const { mixin, events, update } = createWatching()
    await mixin.checkTagsChange(POOL_ADMIN, VM, { added: ['vdf:role=app'] })
    update({ ...VM, tags: ['web', 'vdf:role=app'] })
    assert.equal(events.length, 1)
    const { timestamp, ...event } = events[0]
    assert.equal(typeof timestamp, 'number')
    assert.deepEqual(event, {
      objectId: 'vm-1',
      objectType: 'VM',
      poolId: 'pool-1',
      tag: 'vdf:role=app',
      change: 'add',
      userId: 'pool-admin',
      outsideXo: false,
    })

    // the note was consumed: the same change again comes from outside
    update({ ...VM, tags: ['web'] })
    update({ ...VM, tags: ['web', 'vdf:role=app'] })
    assert.deepEqual(
      events.map(({ tag, change, userId, outsideXo }) => ({ tag, change, userId, outsideXo })),
      [
        { tag: 'vdf:role=app', change: 'add', userId: 'pool-admin', outsideXo: false },
        { tag: 'vdf:role=app', change: 'remove', userId: undefined, outsideXo: true },
        { tag: 'vdf:role=app', change: 'add', userId: undefined, outsideXo: true },
      ]
    )
  })

  it('reports a change nobody made through XO as outside XO, on VMs and networks', () => {
    const NETWORK = { id: 'net-1', type: 'network', $pool: 'pool-1', tags: ['vdf:net=dmz'] }
    const { events, update } = createWatching([{ ...VM, tags: ['vdf:quarantine'] }, NETWORK])
    update({ ...VM, tags: [] }, { ...NETWORK, tags: [] })
    assert.deepEqual(
      events.map(({ objectId, objectType, tag, change, outsideXo, userId }) => ({
        objectId,
        objectType,
        tag,
        change,
        outsideXo,
        userId,
      })),
      [
        {
          objectId: 'vm-1',
          objectType: 'VM',
          tag: 'vdf:quarantine',
          change: 'remove',
          outsideXo: true,
          userId: undefined,
        },
        {
          objectId: 'net-1',
          objectType: 'network',
          tag: 'vdf:net=dmz',
          change: 'remove',
          outsideXo: true,
          userId: undefined,
        },
      ]
    )
  })

  it('a change the guard refused is not noted', async () => {
    const { mixin, events, update } = createWatching()
    await assert.rejects(mixin.checkTagsChange(VM_ADMIN, VM, { added: ['vdf:role=app'] }))
    update({ ...VM, tags: ['web', 'vdf:role=app'] })
    assert.equal(events[0].outsideXo, true)
  })

  it('a note expires after 30 seconds', async t => {
    let now = 1_000_000
    t.mock.method(Date, 'now', () => now)
    const { mixin, events, update } = createWatching()
    await mixin.checkTagsChange(ADMIN, VM, { added: ['vdf:role=app'] })
    await mixin.checkTagsChange(ADMIN, VM, { added: ['vdf:role=db'] })
    now += 29 * 1000
    update({ ...VM, tags: ['web', 'vdf:role=app'] })
    now += 1000
    update({ ...VM, tags: ['web', 'vdf:role=app', 'vdf:role=db'] })
    assert.deepEqual(
      events.map(({ tag, outsideXo }) => ({ tag, outsideXo })),
      [
        { tag: 'vdf:role=app', outsideXo: false },
        { tag: 'vdf:role=db', outsideXo: true },
      ]
    )
  })

  it('a change that changes nothing is not noted: a later change outside XO is reported as such', async () => {
    const { mixin, events, update } = createWatching()
    // removing a tag the VM lacks, adding one it has: allowed, but no XAPI event will follow
    await mixin.checkTagsChange(ADMIN, { ...VM, tags: ['web'] }, { removed: ['vdf:quarantine'] })
    await mixin.checkTagsChange(ADMIN, { ...VM, tags: ['web'] }, { added: ['vdf:quarantine'] })
    update({ ...VM, tags: ['web', 'vdf:quarantine'] })
    await mixin.checkTagsChange(ADMIN, { ...VM, tags: ['web', 'vdf:quarantine'] }, { added: ['vdf:quarantine'] })
    // xe vm-param-remove, then xe vm-param-add
    update({ ...VM, tags: ['web'] })
    update({ ...VM, tags: ['web', 'vdf:quarantine'] })
    assert.deepEqual(
      events.map(({ tag, change, userId, outsideXo }) => ({ tag, change, userId, outsideXo })),
      [
        { tag: 'vdf:quarantine', change: 'add', userId: 'admin', outsideXo: false },
        { tag: 'vdf:quarantine', change: 'remove', userId: undefined, outsideXo: true },
        { tag: 'vdf:quarantine', change: 'add', userId: undefined, outsideXo: true },
      ]
    )
  })

  it('a migration allowed is not noted: the tags do not change', async () => {
    const { mixin, events, update } = createWatching()
    await mixin.checkMigration(ADMIN, { ...VM, tags: ['web', 'vdf:role=app'] }, 'pool-2')
    update({ ...VM, tags: ['web', 'vdf:role=app'] })
    assert.equal(events[0].outsideXo, true)
  })

  it('the group tags a new VM keeps are not noted', async () => {
    const vm = createNewVm(['web', 'vdf:role=app'])
    const { mixin, events, update } = createWatching([{ id: 'new-vm', type: 'VM', $pool: 'pool-1', tags: vm.tags }])
    assert.deepEqual(await mixin.stripInheritedReservedTags(ADMIN, vm), [])
    update({ id: 'new-vm', type: 'VM', $pool: 'pool-1', tags: ['web'] })
    assert.equal(events[0].outsideXo, true)
  })

  it('reports nothing for objects loaded, new or reloaded, nor for tags that are not reserved', () => {
    const { app, events, update } = createWatching([{ ...VM, tags: ['vdf:quarantine'] }])
    // reconnection to the pool: removed, then loaded again as they are now
    app.objects.emit('remove', { 'vm-1': undefined })
    app.objects.emit('add', { 'vm-1': { ...VM, tags: [] } })
    // an object XO had not seen
    update({ id: 'vm-2', type: 'VM', $pool: 'pool-1', tags: ['vdf:role=app'] })
    // not watched
    update({ id: 'tpl-1', type: 'VM-template', $pool: 'pool-1', tags: ['vdf:role=app'] })
    update({ id: 'tpl-1', type: 'VM-template', $pool: 'pool-1', tags: [] })
    // not reserved
    update({ ...VM, tags: ['web', 'vdf'] })
    assert.deepEqual(events, [])
  })

  it('attributes the tags stripped from a new VM to XO', async () => {
    const vm = createNewVm(['web', 'vdf:role=app', 'vdf:quarantine'])
    const { mixin, events, update } = createWatching([{ id: 'new-vm', type: 'VM', $pool: 'pool-1', tags: vm.tags }])
    await mixin.stripInheritedReservedTags(VM_ADMIN, vm)
    update({ id: 'new-vm', type: 'VM', $pool: 'pool-1', tags: vm.tags })
    assert.deepEqual(
      events.map(({ objectId, tag, change, userId, outsideXo }) => ({ objectId, tag, change, userId, outsideXo })),
      [{ objectId: 'new-vm', tag: 'vdf:role=app', change: 'remove', userId: 'xo', outsideXo: false }]
    )
  })

  it('a VM XO is creating: its tags are part of its creation, for 30 seconds', t => {
    let now = 1_000_000
    t.mock.method(Date, 'now', () => now)
    const creation = { date: new Date(now).toISOString(), user: 'admin' }
    const { events, update } = createWatching([{ ...VM, tags: [], creation }])
    now += 29 * 1000
    update({ ...VM, tags: ['vdf:role=app'], creation })
    assert.deepEqual(events, [])

    // created 30 seconds ago: reported
    now += 1000
    update({ ...VM, tags: [], creation })
    assert.deepEqual(
      events.map(({ tag, change, outsideXo }) => ({ tag, change, outsideXo })),
      [{ tag: 'vdf:role=app', change: 'remove', outsideXo: true }]
    )
  })
})
