import assert from 'node:assert/strict'
import aclResolver from 'xo-acl-resolver'
import { EventEmitter } from 'node:events'
import { describe, it } from 'node:test'
import { featureUnauthorized, forbiddenOperation } from 'xo-common/api-errors.js'

import ReservedTags, {
  diffTags,
  firewallActionsForTag,
  isReservedTag,
  RESERVED_TAG_CHANGE_EVENT,
  RESERVED_TAGS_STRIPPED_EVENT,
} from './reserved-tags.mjs'

const OBJECTS = {
  'pool-1': { id: 'pool-1', type: 'pool', $pool: 'pool-1', name_label: 'prod', tags: [] },
  'pool-2': { id: 'pool-2', type: 'pool', $pool: 'pool-2', name_label: 'lab', tags: [] },
  'vm-1': { id: 'vm-1', type: 'VM', $container: 'pool-1', $pool: 'pool-1' },
}
const VM = OBJECTS['vm-1']

const ADMIN = { id: 'admin', permission: 'admin' }
const POOL_ADMIN = { id: 'pool-admin', permission: 'none' }
const VM_ADMIN = { id: 'vm-admin', permission: 'none' }
const POOL_2_ADMIN = { id: 'pool-2-admin', permission: 'none' }
const POOL_VIEWER = { id: 'pool-viewer', permission: 'none' }
const NOBODY = { id: 'nobody', permission: 'none' }

// the legacy ACLs of each user, as `getPermissionsForUser` returns them: the
// admin role grants view, operate and administrate, the viewer role view
const ADMIN_ROLE = { view: true, operate: true, administrate: true }
const PERMISSIONS_BY_USER = {
  [POOL_ADMIN.id]: { 'pool-1': ADMIN_ROLE },
  [VM_ADMIN.id]: { 'vm-1': ADMIN_ROLE },
  [POOL_2_ADMIN.id]: { 'pool-2': ADMIN_ROLE },
  [POOL_VIEWER.id]: { 'pool-1': { view: true } },
}

// users with RBAC roles only, named after their privileges on the firewall
const rbacUser = id => ({ id, permission: 'none' })
const MEMBERSHIP = rbacUser('membership')
const QUARANTINE_ADD = rbacUser('quarantine:add')
const QUARANTINE_REMOVE = rbacUser('quarantine:remove')
const QUARANTINE = rbacUser('quarantine')
const FIREWALL_ADMIN = rbacUser('*')
const READ_PUBLISH = rbacUser('read+publish')
const POOL_2_MEMBERSHIP = rbacUser('membership on pool-2')
const PROD_MEMBERSHIP = rbacUser('membership on prod')
const ALL_BUT_LIFT = rbacUser('* but quarantine:remove on prod')
const VM_TAGGER = rbacUser('vm update:tags')

const firewallPrivilege = (action, selector, effect = 'allow') => ({
  id: `${action}|${selector}|${effect}`,
  roleId: 'role',
  resource: 'firewall',
  action,
  effect,
  ...(selector === undefined ? {} : { selector }),
})

// the RBAC privileges of each user, as `getAclV2UserPrivileges` returns them
const PRIVILEGES_BY_USER = {
  [MEMBERSHIP.id]: [firewallPrivilege('membership')],
  [QUARANTINE_ADD.id]: [firewallPrivilege('quarantine:add')],
  [QUARANTINE_REMOVE.id]: [firewallPrivilege('quarantine:remove')],
  [QUARANTINE.id]: [firewallPrivilege('quarantine')],
  [FIREWALL_ADMIN.id]: [firewallPrivilege('*')],
  [READ_PUBLISH.id]: [firewallPrivilege('read'), firewallPrivilege('publish')],
  [POOL_2_MEMBERSHIP.id]: [firewallPrivilege('membership', 'id:pool-2')],
  [PROD_MEMBERSHIP.id]: [firewallPrivilege('membership', 'name_label:prod')],
  [ALL_BUT_LIFT.id]: [firewallPrivilege('*'), firewallPrivilege('quarantine:remove', 'name_label:prod', 'deny')],
  [VM_TAGGER.id]: [{ id: 'vm', roleId: 'role', resource: 'vm', action: 'update:tags', effect: 'allow' }],
}

// `hasPermissions` as the ACLs mixin implements it, and `getAclV2UserPrivileges`
// (throws `featureUnauthorized` without `rbac`, as on an XOA whose licence
// lacks it), counting their calls; the app's hooks and objects (XO's object
// collection) as event emitters
function createMixin({ rbac = true } = {}) {
  const app = Object.assign(new EventEmitter(), {
    hooks: new EventEmitter(),
    objects: new EventEmitter(),
    hasPermissionsCalls: 0,
    privilegesCalls: 0,
    async hasPermissions(userId, permissions) {
      this.hasPermissionsCalls++
      return aclResolver.check(PERMISSIONS_BY_USER[userId] ?? {}, id => OBJECTS[id], permissions)
    },
    async getAclV2UserPrivileges(userId) {
      this.privilegesCalls++
      if (!rbac) {
        throw featureUnauthorized({ featureCode: 'RBAC' })
      }
      return PRIVILEGES_BY_USER[userId] ?? []
    },
    getObject(id, type) {
      const object = OBJECTS[id]
      if (object === undefined || object.type !== type) {
        throw new Error(`no such ${type} ${id}`)
      }
      return object
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

describe('firewallActionsForTag', () => {
  it('quarantining or lifting it for vdf:quarantine, membership for a group tag', () => {
    assert.deepEqual(firewallActionsForTag('add', 'vdf:quarantine', 'VM'), ['quarantine:add'])
    assert.deepEqual(firewallActionsForTag('remove', 'vdf:quarantine', 'VM'), ['quarantine:remove'])
    assert.deepEqual(firewallActionsForTag('add', 'vdf:role=app', 'VM'), ['membership'])
    assert.deepEqual(firewallActionsForTag('remove', 'vdf:role=app', 'VM'), ['membership'])
  })

  it('publish for any reserved tag on a network', () => {
    for (const tag of ['vdf:net=dmz', 'vdf:unprotected', 'vdf:role=app', 'vdf:quarantine']) {
      assert.deepEqual(firewallActionsForTag('add', tag, 'network'), ['publish'], tag)
      assert.deepEqual(firewallActionsForTag('remove', tag, 'network'), ['publish'], tag)
    }
  })

  it('membership and publish for a network tag on another object', () => {
    assert.deepEqual(firewallActionsForTag('add', 'vdf:net=dmz', 'VM'), ['membership', 'publish'])
    assert.deepEqual(firewallActionsForTag('remove', 'vdf:unprotected', 'VM'), ['membership', 'publish'])
  })
})

describe('hasFirewallRight', () => {
  it('counts the legacy view permission on the pool as read, administrate as every action', async () => {
    const { mixin } = createMixin()
    assert.equal(await mixin.hasFirewallRight(POOL_VIEWER, 'pool-1', 'read'), true)
    assert.equal(await mixin.hasFirewallRight(POOL_VIEWER, 'pool-1', 'publish'), false)
    for (const action of ['read', 'publish', 'membership', 'quarantine:add', 'quarantine:remove']) {
      assert.equal(await mixin.hasFirewallRight(POOL_ADMIN, 'pool-1', action), true, action)
      assert.equal(await mixin.hasFirewallRight(POOL_ADMIN, 'pool-2', action), false, action)
    }
  })

  it('evaluates the RBAC privileges against the pool', async () => {
    const { mixin } = createMixin()
    assert.equal(await mixin.hasFirewallRight(READ_PUBLISH, 'pool-1', 'publish'), true)
    assert.equal(await mixin.hasFirewallRight(READ_PUBLISH, 'pool-1', 'membership'), false)
    assert.equal(await mixin.hasFirewallRight(POOL_2_MEMBERSHIP, 'pool-2', 'membership'), true)
    assert.equal(await mixin.hasFirewallRight(POOL_2_MEMBERSHIP, 'pool-1', 'membership'), false)
    assert.equal(await mixin.hasFirewallRight(PROD_MEMBERSHIP, 'pool-1', 'membership'), true)
    assert.equal(await mixin.hasFirewallRight(PROD_MEMBERSHIP, 'pool-2', 'membership'), false)
  })

  it('allows an XO administrator and calls without a user, without looking at any ACL', async () => {
    const { app, mixin } = createMixin()
    assert.equal(await mixin.hasFirewallRight(ADMIN, 'pool-1', 'quarantine:remove'), true)
    assert.equal(await mixin.hasFirewallRight(undefined, 'pool-1', 'publish'), true)
    assert.equal(app.hasPermissionsCalls + app.privilegesCalls, 0)
  })

  it('does not look at RBAC privileges when the legacy ACL is enough', async () => {
    const { app, mixin } = createMixin()
    assert.equal(await mixin.hasFirewallRight(POOL_ADMIN, 'pool-1', 'membership'), true)
    assert.equal(app.privilegesCalls, 0)
  })

  it('refuses a pool XO does not know to an RBAC user', async () => {
    const { mixin } = createMixin()
    await assert.rejects(mixin.hasFirewallRight(FIREWALL_ADMIN, 'pool-3', 'read'), /no such pool/)
  })

  it('throws on an action the firewall does not have', async () => {
    const { mixin } = createMixin()
    await assert.rejects(mixin.hasFirewallRight(ADMIN, 'pool-1', 'quarantine'), TypeError)
  })
})

describe('checkTagsChange: who may change which reserved tag', () => {
  // on a VM of pool-1 (named prod), and a network tag on a network of it
  const NETWORK = { id: 'net-1', type: 'network', $pool: 'pool-1', tags: [] }
  const CHANGES = {
    'join a group': [VM, { added: ['vdf:role=app'] }],
    'leave a group': [VM, { removed: ['vdf:role=app'] }],
    'tag a network': [NETWORK, { added: ['vdf:net=dmz'] }],
    'unprotect a network': [NETWORK, { added: ['vdf:unprotected'] }],
    'put a group tag on a network': [NETWORK, { added: ['vdf:role=app'] }],
    'put a network tag on a VM': [VM, { added: ['vdf:net=dmz'] }],
    quarantine: [VM, { added: ['vdf:quarantine'] }],
    lift: [VM, { removed: ['vdf:quarantine'] }],
  }
  const ALL = Object.keys(CHANGES)
  const MEMBERSHIP_CHANGES = ['join a group', 'leave a group']
  const PUBLISH_CHANGES = ['tag a network', 'unprotect a network', 'put a group tag on a network']
  const EXPECTED = [
    ['an XO administrator', ADMIN, ALL],
    ['administrate on the pool (legacy)', POOL_ADMIN, ALL],
    ['view on the pool (legacy)', POOL_VIEWER, []],
    ['administrate on the VM only (legacy)', VM_ADMIN, []],
    ['firewall *', FIREWALL_ADMIN, ALL],
    ['firewall membership', MEMBERSHIP, MEMBERSHIP_CHANGES],
    ['firewall quarantine:add', QUARANTINE_ADD, ['quarantine']],
    ['firewall quarantine:remove', QUARANTINE_REMOVE, ['lift']],
    ['firewall quarantine', QUARANTINE, ['quarantine', 'lift']],
    ['firewall read and publish', READ_PUBLISH, PUBLISH_CHANGES],
    ['firewall membership on the pool, selected by name', PROD_MEMBERSHIP, MEMBERSHIP_CHANGES],
    ['firewall membership on another pool', POOL_2_MEMBERSHIP, []],
    ['firewall *, but quarantine:remove denied on the pool', ALL_BUT_LIFT, ALL.filter(change => change !== 'lift')],
    ['vm update:tags only', VM_TAGGER, []],
    ['no ACL and no role', NOBODY, []],
  ]

  for (const [who, user, allowed] of EXPECTED) {
    it(who, async () => {
      const { mixin } = createMixin()
      for (const [name, [object, change]] of Object.entries(CHANGES)) {
        const check = mixin.checkTagsChange(user, object, change)
        if (allowed.includes(name)) {
          await assert.doesNotReject(check, name)
        } else {
          const [tag] = [...(change.added ?? []), ...(change.removed ?? [])]
          await assert.rejects(check, isRefusal(tag), name)
        }
      }
    })
  }

  it('says which right is missing', async () => {
    const { mixin } = createMixin()
    await assert.rejects(mixin.checkTagsChange(QUARANTINE_ADD, VM, { removed: ['vdf:quarantine'] }), error => {
      assert.equal(
        error.data.reason,
        'the tag "vdf:quarantine" belongs to the firewall: removing it takes the firewall quarantine:remove privilege on the pool, the administrate permission on it, or an XO administrator'
      )
      return true
    })
    await assert.rejects(mixin.checkTagsChange(QUARANTINE, VM, { added: ['vdf:role=app'] }), error => {
      assert.equal(
        error.data.reason,
        'the tag "vdf:role=app" belongs to the firewall: adding it takes the firewall membership privilege on the pool, the administrate permission on it, or an XO administrator'
      )
      return true
    })
    await assert.rejects(
      mixin.checkTagsChange(
        MEMBERSHIP,
        { id: 'net-1', type: 'network', $pool: 'pool-1' },
        { removed: ['vdf:unprotected'] }
      ),
      error => {
        assert.equal(
          error.data.reason,
          'the tag "vdf:unprotected" belongs to the firewall: removing it on a network takes the firewall publish privilege on the pool, the administrate permission on it, or an XO administrator'
        )
        return true
      }
    )
    await assert.rejects(mixin.checkTagsChange(MEMBERSHIP, VM, { added: ['vdf:net=dmz'] }), error => {
      assert.equal(
        error.data.reason,
        'the tag "vdf:net=dmz" belongs to the firewall: adding it takes the firewall publish privilege on the pool, the administrate permission on it, or an XO administrator'
      )
      return true
    })
  })

  it('refuses a change when one of its reserved tags is refused', async () => {
    const { mixin } = createMixin()
    await assert.rejects(
      mixin.checkTagsChange(MEMBERSHIP, VM, { added: ['vdf:role=app'], removed: ['vdf:quarantine'] }),
      isRefusal('vdf:quarantine')
    )
  })

  it('looks at the RBAC privileges once per action in a change', async () => {
    const { app, mixin } = createMixin()
    await mixin.checkTagsChange(MEMBERSHIP, VM, { added: ['vdf:role=app', 'vdf:role=db'], removed: ['vdf:role=web'] })
    assert.equal(app.privilegesCalls, 1)
  })

  it('without the RBAC feature (XOA licence), only legacy ACLs count', async () => {
    const { mixin } = createMixin({ rbac: false })
    await assert.rejects(
      mixin.checkTagsChange(FIREWALL_ADMIN, VM, { added: ['vdf:role=app'] }),
      isRefusal('vdf:role=app')
    )
    await mixin.checkTagsChange(POOL_ADMIN, VM, { added: ['vdf:role=app'], removed: ['vdf:quarantine'] })
    await mixin.checkTagsChange(ADMIN, VM, { removed: ['vdf:quarantine'] })
  })

  it('fails the change when the RBAC privileges cannot be read', async () => {
    const { app, mixin } = createMixin()
    const error = new Error('redis is down')
    app.getAclV2UserPrivileges = async () => {
      throw error
    }
    await assert.rejects(mixin.checkTagsChange(FIREWALL_ADMIN, VM, { added: ['vdf:role=app'] }), error)
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

  it("takes quarantine:remove on the template's pool to drop vdf:quarantine, membership to add a group tag", async () => {
    const { mixin } = createMixin()
    assert.deepEqual(await mixin.checkNewVmTags(QUARANTINE_REMOVE, TEMPLATE, ['keep'], undefined), ['keep'])
    await assert.rejects(
      mixin.checkNewVmTags(QUARANTINE_ADD, TEMPLATE, ['keep'], undefined),
      isRefusal('vdf:quarantine')
    )
    await assert.rejects(mixin.checkNewVmTags(MEMBERSHIP, TEMPLATE, ['keep'], undefined), isRefusal('vdf:quarantine'))
    assert.deepEqual(await mixin.checkNewVmTags(MEMBERSHIP, TEMPLATE, ['vdf:quarantine', 'vdf:role=app'], undefined), [
      'vdf:quarantine',
      'vdf:role=app',
    ])
    await assert.rejects(
      mixin.checkNewVmTags(POOL_2_MEMBERSHIP, TEMPLATE, ['vdf:quarantine', 'vdf:role=app'], undefined),
      isRefusal('vdf:role=app')
    )
  })
})

describe('checkMigration', () => {
  const TAGGED_VM = { ...VM, tags: ['web', 'vdf:role=app', 'vdf:quarantine'] }

  const isMigrationRefusal = error =>
    forbiddenOperation.is(error) &&
    error.data.reason ===
      'the VM carries firewall tags (vdf:role=app): migrating it to another pool takes the firewall membership privilege on the destination pool, the administrate permission on it, or an XO administrator'

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

  it('lets a user with the firewall membership privilege on the destination pool migrate it', async () => {
    const { mixin } = createMixin()
    await mixin.checkMigration(POOL_2_MEMBERSHIP, TAGGED_VM, 'pool-2')
    await mixin.checkMigration(MEMBERSHIP, TAGGED_VM, 'pool-2')
  })

  it('refuses membership on the source pool only, or another firewall privilege on the destination', async () => {
    const { mixin } = createMixin()
    await assert.rejects(mixin.checkMigration(PROD_MEMBERSHIP, TAGGED_VM, 'pool-2'), isMigrationRefusal)
    await assert.rejects(mixin.checkMigration(QUARANTINE, TAGGED_VM, 'pool-2'), isMigrationRefusal)
    await assert.rejects(mixin.checkMigration(READ_PUBLISH, TAGGED_VM, 'pool-2'), isMigrationRefusal)
  })
})

// the XAPI record of a VM just created on a pool, recording the tags written on it and its destruction
function createNewVm(tags, { pool = 'pool-1', setTags = async () => {}, destroy = async () => {} } = {}) {
  const vm = {
    uuid: 'new-vm',
    $ref: 'OpaqueRef:new-vm',
    name_label: 'web-1-copy',
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

  it('lets a user with the firewall membership privilege on the pool keep the reserved tags', async () => {
    const { mixin } = createMixin()
    const vm = createNewVm(TAGS)
    assert.deepEqual(await mixin.stripInheritedReservedTags(PROD_MEMBERSHIP, vm), [])
    assert.deepEqual(vm.tagsWritten, [])
  })

  it('strips the group tags of a user with quarantine privileges only, or membership on another pool', async () => {
    const { mixin } = createMixin()
    for (const user of [QUARANTINE, POOL_2_MEMBERSHIP, VM_TAGGER]) {
      const vm = createNewVm(TAGS)
      assert.deepEqual(await mixin.stripInheritedReservedTags(user, vm), ['vdf:role=app', 'vdf:role=db'], user.id)
      assert.deepEqual(vm.tagsWritten, [['web', 'vdf:quarantine']], user.id)
    }
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

describe('the tags stripped, emitted', () => {
  const TAGS = ['web', 'vdf:role=app', 'vdf:quarantine', 'vdf:role=db']
  const emitted = app => {
    const events = []
    app.on(RESERVED_TAGS_STRIPPED_EVENT, event => events.push(event))
    return events
  }

  it('once removed: the VM, its pool, the tags, who created it, when', async t => {
    t.mock.method(Date, 'now', () => 1_000_000)
    const { app, mixin } = createMixin()
    const events = emitted(app)
    const vm = createNewVm(TAGS, { pool: 'pool-2' })
    await mixin.stripInheritedReservedTags(VM_ADMIN, vm)
    assert.deepEqual(events, [
      {
        vmId: 'new-vm',
        vmName: 'web-1-copy',
        poolId: 'pool-2',
        tags: ['vdf:role=app', 'vdf:role=db'],
        userId: VM_ADMIN.id,
        timestamp: 1_000_000,
      },
    ])
  })

  it('not when nothing is stripped, nor when the removal fails', async () => {
    const { app, mixin } = createMixin()
    const events = emitted(app)
    await mixin.stripInheritedReservedTags(ADMIN, createNewVm(TAGS))
    await mixin.stripInheritedReservedTags(VM_ADMIN, createNewVm(['web', 'vdf:quarantine']))
    await mixin.stripInheritedReservedTags(undefined, createNewVm(TAGS))
    const failing = createNewVm(TAGS, {
      setTags: async () => {
        throw new Error('XAPI is down')
      },
    })
    await assert.rejects(mixin.stripInheritedReservedTagsOrDestroy(VM_ADMIN, failing))
    assert.deepEqual(events, [])
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
