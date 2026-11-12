import assert from 'node:assert/strict'
import aclResolver from 'xo-acl-resolver'
import { describe, it } from 'node:test'
import { forbiddenOperation } from 'xo-common/api-errors.js'

import ReservedTags, { diffTags, isReservedTag } from './reserved-tags.mjs'

const OBJECTS = {
  'pool-1': { id: 'pool-1', type: 'pool', $pool: 'pool-1' },
  'pool-2': { id: 'pool-2', type: 'pool', $pool: 'pool-2' },
  'vm-1': { id: 'vm-1', type: 'VM', $container: 'pool-1', $pool: 'pool-1' },
}
const VM = OBJECTS['vm-1']

const ADMIN = { id: 'admin', permission: 'admin' }
const POOL_ADMIN = { id: 'pool-admin', permission: 'none' }
const VM_ADMIN = { id: 'vm-admin', permission: 'none' }

// the legacy ACLs of each user, as `getPermissionsForUser` returns them
const PERMISSIONS_BY_USER = {
  [POOL_ADMIN.id]: { 'pool-1': { administrate: 1 } },
  [VM_ADMIN.id]: { 'vm-1': { administrate: 1 } },
}

// `hasPermissions` as the ACLs mixin implements it, counting its calls
function createMixin() {
  const app = {
    hasPermissionsCalls: 0,
    async hasPermissions(userId, permissions) {
      this.hasPermissionsCalls++
      return aclResolver.check(PERMISSIONS_BY_USER[userId] ?? {}, id => OBJECTS[id], permissions)
    },
  }
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

// the XAPI record of a VM just created on a pool, recording the tags written on it
function createNewVm(tags, { pool = 'pool-1', setTags = async () => {} } = {}) {
  const vm = {
    uuid: 'new-vm',
    tags,
    tagsWritten: [],
    $xapi: { xo: { addObject: vm => ({ id: vm.uuid, type: 'VM', $container: pool, $pool: pool }) } },
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
