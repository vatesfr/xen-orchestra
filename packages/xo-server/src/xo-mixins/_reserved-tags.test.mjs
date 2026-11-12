import assert from 'node:assert/strict'
import aclResolver from 'xo-acl-resolver'
import { describe, it } from 'node:test'
import { forbiddenOperation } from 'xo-common/api-errors.js'

import ReservedTags, { diffTags, isReservedTag } from './reserved-tags.mjs'

const OBJECTS = {
  'pool-1': { id: 'pool-1', type: 'pool', $pool: 'pool-1' },
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
