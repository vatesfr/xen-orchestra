import '../logSetup.js'
import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { createLogger } from '@xen-orchestra/log'

import { getRequiredEnv } from '../utils/index.js'
import { xoConnection } from '../client/xoLibClient.js'
import {
  connectAs,
  createTestGroup,
  createTestUser,
  deleteTestGroup,
  deleteTestUser,
  EVENT_WINDOW,
  fetchAllObjects,
  grant,
  findVmStorage,
  pickObjectsByType,
  purgeLeftoverFixtures,
  recordPushedObjects,
  revoke,
  summarize,
  wait,
  waitUntil,
  withTag,
} from '../utils/rbacUtils.js'

const log = createLogger('xo:qa-test:rbac')

// Time left for the server to apply an ACL change before it is observed.
const SETTLE = 2_000

describe('RBAC — server-side object filtering', () => {
  /** admin connection: arranges the fixtures */
  let admin
  /** low-privilege connection: observes what the server sends it */
  let user
  let testUser
  let recorder
  let referenceVmId
  let referencePoolId

  before(async () => {
    admin = await xoConnection({
      xoUrl: getRequiredEnv('HOSTNAME'),
      username: getRequiredEnv('USERNAME'),
      password: getRequiredEnv('PASSWORD'),
    })

    // an `after` hook does not run when its `before` threw, so a suite that
    // failed half way leaves fixtures — and their ACLs — on the appliance
    await purgeLeftoverFixtures(admin)

    referenceVmId = getRequiredEnv('REFERENCE_VM_ID')

    // fail early and clearly rather than through a confusing assertion later
    const allObjects = await fetchAllObjects(admin)
    const referenceVm = allObjects[referenceVmId]
    assert.notEqual(referenceVm, undefined, `REFERENCE_VM_ID ${referenceVmId} is not a known XO object`)
    assert.equal(referenceVm.type, 'VM', `REFERENCE_VM_ID ${referenceVmId} is a ${referenceVm.type}, not a VM`)

    referencePoolId = referenceVm.$pool
    assert.notEqual(referencePoolId, undefined, 'the reference VM has no $pool')

    log.debug('admin sees the whole infrastructure', {
      summary: summarize(allObjects, 20),
      referencePoolId,
    })

    testUser = await createTestUser(admin)
    user = await connectAs(testUser)
    recorder = recordPushedObjects(user)
  })

  after(async () => {
    recorder?.stop()
    await user?.close()

    if (testUser !== undefined) {
      await deleteTestUser(admin, testUser.id)
    }
    await admin?.close()
  })

  describe('a user without any ACL', () => {
    it('is granted no permission at all', async () => {
      const permissions = await user.call('acl.getCurrentPermissions')
      const granted = Object.keys(permissions)

      assert.equal(granted.length, 0, `expected no ACL, got: ${granted.join(', ')}`)
    })

    // Path 1 of 2: the bulk fetch xo-web performs on sign-in.
    it('receives no object from xo.getAllObjects', async () => {
      const objects = await fetchAllObjects(user)
      const received = Object.keys(objects).length

      assert.equal(received, 0, `expected no object, received ${received}: ${summarize(objects)}`)
    })

    // Tags carry organisational meaning — `customer-acme`, `prod-finance` —
    // so the configured list is scoped to the objects the caller may see
    // rather than locked to admins, which would cost everyone tag colours.
    it('receives no configured tag', async () => {
      const tags = await user.call('tag.getAllConfigured')

      assert.equal(tags.length, 0, `expected no tag, received: ${tags.map(({ id }) => id).join(', ')}`)
    })

    // Path 2 of 2: the push stream. A fix could land one path and miss the
    // other, so they are asserted separately.
    it('receives no object on the event stream while the infrastructure changes', async () => {
      recorder.reset()

      await withTag(admin, referenceVmId, `qa-rbac-${Date.now()}`, () => wait(EVENT_WINDOW))

      // `exited` is not asserted: removals carry ids only and are forwarded to
      // every connection by design
      const pushed = Object.fromEntries(recorder.entered)
      const nPushed = recorder.entered.size

      assert.equal(nPushed, 0, `expected nothing to be pushed, received ${nPushed}: ${summarize(pushed)}`)
    })
  })

  describe('a user with `view` on a single VM', () => {
    before(async () => {
      await grant(admin, testUser.id, referenceVmId)
      await wait(SETTLE)
    })

    after(async () => {
      await revoke(admin, testUser.id, referenceVmId)
    })

    it('receives that VM', async () => {
      const objects = await fetchAllObjects(user)

      assert.ok(referenceVmId in objects, `the granted VM was not returned; received ${summarize(objects)}`)
    })

    it('receives no other VM, and no host, pool, SR or network', async () => {
      const objects = await fetchAllObjects(user)

      const otherVmIds = Object.keys(objects).filter(id => objects[id].type === 'VM' && id !== referenceVmId)
      assert.equal(
        otherVmIds.length,
        0,
        `expected only the granted VM, also received ${otherVmIds.length} others, e.g. ${otherVmIds.slice(0, 3).join(', ')}`
      )

      // the VM's own disks, interfaces and snapshots are expected: access is
      // inherited downwards. Its container is not.
      const infrastructure = Object.fromEntries(
        Object.entries(objects).filter(([, object]) => ['host', 'pool', 'SR', 'network'].includes(object.type))
      )
      const nLeaked = Object.keys(infrastructure).length
      assert.equal(nLeaked, 0, `expected no infrastructure object, received ${nLeaked}: ${summarize(infrastructure)}`)

      log.debug('objects visible with a single VM grant', { summary: summarize(objects, 20) })
    })
  })

  // Permissions are inherited downwards: granting a pool grants everything it
  // contains. This is the resolver's `checkMember('$container')` / `$pool`
  // rules, and it is what makes a single ACL usable in practice.
  describe('a user with `view` on a pool', () => {
    let visible

    before(async () => {
      await grant(admin, testUser.id, referencePoolId)
      await wait(SETTLE)
      visible = await fetchAllObjects(user)
    })

    after(async () => {
      await revoke(admin, testUser.id, referencePoolId)
    })

    it('receives the pool itself', () => {
      assert.ok(referencePoolId in visible, `the granted pool was not returned; received ${summarize(visible)}`)
    })

    it('receives every host of that pool', async () => {
      const everything = await fetchAllObjects(admin)
      const expected = Object.keys(everything)
        .filter(id => everything[id].type === 'host' && everything[id].$pool === referencePoolId)
        .sort()
      const received = Object.keys(visible)
        .filter(id => visible[id].type === 'host')
        .sort()

      // under-sharing is as much a bug as over-sharing
      assert.deepEqual(received, expected, 'the hosts of the granted pool were not all returned')
    })

    it('receives the VMs, SRs and networks of that pool', () => {
      for (const type of ['VM', 'SR', 'network']) {
        const n = Object.values(visible).filter(object => object.type === type).length
        assert.ok(n > 0, `expected at least one ${type}, received ${summarize(visible)}`)
      }
    })

    // Every XO object carries the pool it belongs to, which makes the
    // cross-pool check exact. On a single-pool lab this passes trivially.
    it('receives nothing belonging to another pool', () => {
      const foreign = Object.fromEntries(
        Object.entries(visible).filter(([, object]) => object.$pool !== referencePoolId)
      )
      const nForeign = Object.keys(foreign).length

      assert.equal(
        nForeign,
        0,
        `expected nothing outside the granted pool, received ${nForeign}: ${summarize(foreign)}`
      )
    })
  })

  // A grant made to a group must reach its members, and must stop reaching
  // them as soon as they leave it — which is also the only coverage of the
  // group-membership cache invalidation.
  describe('a user granted access through a group', () => {
    let group

    before(async () => {
      group = await createTestGroup(admin)
      await admin.call('group.addUser', { id: group.id, userId: testUser.id })
      await grant(admin, group.id, referenceVmId)
      await wait(SETTLE)
    })

    after(async () => {
      await revoke(admin, group.id, referenceVmId)
      await deleteTestGroup(admin, group.id)
    })

    it('receives the VM granted to the group', async () => {
      const objects = await fetchAllObjects(user)

      assert.ok(
        referenceVmId in objects,
        `the VM granted to the group was not returned; received ${summarize(objects)}`
      )
    })

    it('stops receiving it once removed from the group', async () => {
      await admin.call('group.removeUser', { id: group.id, userId: testUser.id })
      await wait(SETTLE)

      const objects = await fetchAllObjects(user)
      const received = Object.keys(objects).length

      assert.equal(
        received,
        0,
        `expected no object after leaving the group, received ${received}: ${summarize(objects)}`
      )
    })
  })

  // Access flows from a container to what it holds, never back up. Reaching a
  // VM's storage must not reach the VM: on a shared SR that would expose every
  // other tenant's disks and names.
  describe('a user with `view` on an SR', () => {
    let srId
    let vdiId
    let visible

    before(async () => {
      const everything = await fetchAllObjects(admin)
      const storage = findVmStorage(everything, referenceVmId)
      assert.notEqual(storage, undefined, `the reference VM ${referenceVmId} has no disk to derive an SR from`)
      ;({ srId, vdiId } = storage)

      await grant(admin, testUser.id, srId)
      await wait(SETTLE)
      visible = await fetchAllObjects(user)
    })

    after(async () => {
      await revoke(admin, testUser.id, srId)
    })

    it('receives the SR itself', () => {
      assert.ok(srId in visible, `the granted SR was not returned; received ${summarize(visible)}`)
    })

    // Managed and unmanaged disks alike: an unmanaged VDI is the same XAPI
    // object, and the ISO/disk pickers walk the SR's whole VDI list.
    it('receives every disk held by that SR, managed or not', async () => {
      assert.ok(vdiId in visible, `the disk ${vdiId} on the granted SR was not returned`)

      const everything = await fetchAllObjects(admin)
      const onSr = Object.keys(everything).filter(
        id => ['VDI', 'VDI-unmanaged'].includes(everything[id].type) && everything[id].$SR === srId
      )
      const missing = onSr.filter(id => !(id in visible))

      assert.equal(
        missing.length,
        0,
        `${missing.length} of the ${onSr.length} disks on the SR were not returned, e.g. ${missing.slice(0, 3).join(', ')}`
      )
    })

    it('receives no disk belonging to another SR', () => {
      const foreign = Object.values(visible).filter(
        object => ['VDI', 'VDI-unmanaged'].includes(object.type) && object.$SR !== srId
      )

      assert.equal(foreign.length, 0, `received ${foreign.length} disks belonging to another SR`)
    })

    // The reference VM is on this SR by construction, so there is something
    // real to leak here.
    it('receives no VM, even the ones whose disks are on that SR', () => {
      const vms = Object.fromEntries(Object.entries(visible).filter(([, object]) => object.type === 'VM'))
      const nVms = Object.keys(vms).length

      assert.equal(
        nVms,
        0,
        `expected no VM through an SR grant, received ${nVms} (including the reference VM: ${referenceVmId in vms})`
      )
    })

    it('receives no host and no pool', () => {
      const containers = Object.fromEntries(
        Object.entries(visible).filter(([, object]) => object.type === 'host' || object.type === 'pool')
      )
      const nContainers = Object.keys(containers).length

      assert.equal(nContainers, 0, `expected no container, received ${nContainers}: ${summarize(containers)}`)
    })
  })

  // Filtering is computed per user. A regression that reused one user's filter
  // for every connection would still pass every test above, since they all
  // observe a single account.
  describe('two users connected at once', () => {
    let otherUser
    let otherConnection
    let otherRecorder

    before(async () => {
      otherUser = await createTestUser(admin)
      otherConnection = await connectAs(otherUser)
      otherRecorder = recordPushedObjects(otherConnection)

      await grant(admin, testUser.id, referenceVmId)
      await wait(SETTLE)
    })

    after(async () => {
      otherRecorder?.stop()
      await otherConnection?.close()
      await revoke(admin, testUser.id, referenceVmId)
      if (otherUser !== undefined) {
        await deleteTestUser(admin, otherUser.id)
      }
    })

    it('the granted user receives the VM', async () => {
      const objects = await fetchAllObjects(user)

      assert.ok(referenceVmId in objects, 'the granted user did not receive the VM')
    })

    it('the other user receives nothing', async () => {
      const objects = await fetchAllObjects(otherConnection)
      const received = Object.keys(objects).length

      assert.equal(received, 0, `the ungranted user received ${received} objects: ${summarize(objects)}`)
    })

    it('an update to the VM is pushed only to the granted user', async () => {
      recorder.reset()
      otherRecorder.reset()

      await withTag(admin, referenceVmId, `qa-rbac-${Date.now()}`, () => wait(EVENT_WINDOW))

      assert.ok(recorder.entered.has(referenceVmId), 'the granted user was not told about the change')

      const leaked = Object.fromEntries(otherRecorder.entered)
      const nLeaked = otherRecorder.entered.size
      assert.equal(nLeaked, 0, `the ungranted user was pushed ${nLeaked} objects: ${summarize(leaked)}`)
    })

    // An ACL change invalidates every cached permission set, but concerns only
    // its own subject. Without the comparison that follows the invalidation,
    // one grant re-sends the whole visible set of every connected client.
    it('does not re-push to a user whose own permissions did not change', async () => {
      // let the previous test's tag cleanup reach us before we start counting
      await wait(SETTLE)
      recorder.reset()

      await grant(admin, otherUser.id, referenceVmId)
      try {
        await wait(SETTLE)

        const pushed = Object.fromEntries(recorder.entered)
        const nPushed = recorder.entered.size
        assert.equal(
          nPushed,
          0,
          `an unrelated grant re-sent ${nPushed} objects to a user whose permissions were untouched: ${summarize(pushed)}`
        )
      } finally {
        await revoke(admin, otherUser.id, referenceVmId)
      }
    })
  })

  // The event stream only carries *changes*, so a user granted access to an
  // object that already exists would never hear about it. The server pushes
  // their visible set on a permission change to close that gap — nothing else
  // in the suite, nor in the unit tests, covers it.
  describe('a permission granted while connected', () => {
    before(async () => {
      // The grant below must be a *change*, in two senses. An ACL that already
      // exists is silently ignored and emits no event at all. And a grant made
      // inside the debounce window of a preceding revocation is merged with
      // it: the comparison is then made against the state from before that
      // revocation, the permissions come out identical, and no push is due —
      // correctly, since the client never lost the objects.
      //
      // So: revoke, then let the window close.
      await revoke(admin, testUser.id, referenceVmId)
      await wait(SETTLE)
    })

    after(async () => {
      await revoke(admin, testUser.id, referenceVmId)
    })

    it('reaches the client without reconnecting', async () => {
      const before = await user.call('acl.getCurrentPermissions')
      assert.equal(
        Object.keys(before).length,
        0,
        `the user already holds permissions, so the grant would change nothing: ${Object.keys(before).join(', ')}`
      )

      recorder.reset()

      await grant(admin, testUser.id, referenceVmId)
      const arrived = await waitUntil(() => recorder.entered.has(referenceVmId))

      assert.ok(arrived, `the VM was never pushed after the grant (received ${recorder.entered.size} objects)`)
    })

    it('stops reaching the client once revoked', async () => {
      await revoke(admin, testUser.id, referenceVmId)
      await wait(SETTLE)

      // a fresh fetch must no longer return it
      const objects = await fetchAllObjects(user)
      const received = Object.keys(objects).length
      assert.equal(received, 0, `expected no object after the revocation, received ${received}: ${summarize(objects)}`)

      // and no further update about it must be pushed
      recorder.reset()
      await withTag(admin, referenceVmId, `qa-rbac-${Date.now()}`, () => wait(EVENT_WINDOW))

      assert.ok(
        !recorder.entered.has(referenceVmId),
        'updates about the VM were still pushed after the permission was revoked'
      )
    })
  })

  // Self-service users hold no ACL on the resources they build from: the
  // server grants them an implicit `view` on their resource sets, which is
  // what keeps the VM creation form usable once filtering is on.
  describe('a user who is the subject of a resource set', () => {
    let resourceSetId
    let setObjects
    let outsider
    let outsiderConnection
    let visible

    before(async () => {
      const everything = await fetchAllObjects(admin)
      setObjects = pickObjectsByType(everything, referencePoolId, ['VM-template', 'SR', 'network'])
      for (const type of ['VM-template', 'SR', 'network']) {
        assert.notEqual(setObjects[type], undefined, `no ${type} found in pool ${referencePoolId}`)
      }

      const set = await admin.call('resourceSet.create', {
        name: `qa-rbac-${Date.now()}`,
        subjects: [testUser.id],
        objects: Object.values(setObjects),
      })
      resourceSetId = set.id

      outsider = await createTestUser(admin)
      outsiderConnection = await connectAs(outsider)

      await wait(SETTLE)
      visible = await fetchAllObjects(user)
    })

    after(async () => {
      await outsiderConnection?.close()
      if (outsider !== undefined) {
        await deleteTestUser(admin, outsider.id)
      }
      if (resourceSetId !== undefined) {
        await admin
          .call('resourceSet.delete', { id: resourceSetId })
          .catch(error => log.warn('failed to delete the test resource set', { error }))
      }
    })

    it('receives the resources of the set', () => {
      for (const [type, id] of Object.entries(setObjects)) {
        assert.ok(id in visible, `the ${type} of the resource set was not returned; received ${summarize(visible)}`)
      }
    })

    // what the ISO and disk pickers of the VM creation form rely on
    it('receives the disks of the set SR', () => {
      const vdis = Object.values(visible).filter(object => object.type === 'VDI' && object.$SR === setObjects.SR)

      assert.ok(vdis.length > 0, `expected disks on the resource set SR; received ${summarize(visible)}`)
    })

    it('receives no VM belonging to anyone else', () => {
      // guard against passing for the wrong reason: a user who sees nothing at
      // all trivially sees no VM
      assert.ok(Object.keys(visible).length > 0, 'the user sees nothing, so this proves nothing')

      const vms = Object.values(visible).filter(object => object.type === 'VM')

      assert.equal(vms.length, 0, `a resource set must not expose VMs, received ${vms.length}`)
    })

    it('can read the set it is a subject of', async () => {
      const set = await user.call('resourceSet.get', { id: resourceSetId })

      assert.equal(set.id, resourceSetId)
    })

    it('is refused to a user who is not a subject', async () => {
      await assert.rejects(
        () => outsiderConnection.call('resourceSet.get', { id: resourceSetId }),
        error => error.code === 2,
        'a non-subject was able to read the resource set'
      )
    })
  })

  // Filtering must not reach admins: over-filtering would break XO for the
  // people who run it, and no other test would notice.
  describe('an admin', () => {
    it('still receives the whole infrastructure', async () => {
      const objects = await fetchAllObjects(admin)

      assert.ok(referenceVmId in objects, 'the admin lost sight of the reference VM')

      for (const type of ['pool', 'host', 'SR', 'network', 'VM']) {
        const n = Object.values(objects).filter(object => object.type === type).length
        assert.ok(n > 0, `the admin received no ${type}; got ${summarize(objects)}`)
      }

      const pools = new Set(Object.values(objects).map(object => object.$pool))
      assert.ok(pools.size > 0, 'the admin received objects from no pool at all')

      log.debug('admin view unchanged', { objects: Object.keys(objects).length, pools: pools.size })
    })
  })

  // Methods that returned infrastructure-wide data to any authenticated user.
  describe('methods restricted to admins', () => {
    const RESTRICTED = ['pool.listPoolsMatchingCriteria', 'backupNg.getSuggestedExcludedTags']

    // kept open on purpose, see the comment in src/api/cloud-config.mjs
    const OPEN = ['cloudConfig.getAll', 'cloudConfig.getAllNetworkConfigs']

    for (const method of RESTRICTED) {
      it(`${method} is refused to a non-admin`, async () => {
        await assert.rejects(
          () => user.call(method, {}),
          error => error.code === 2,
          `${method} did not refuse a non-admin`
        )
      })
    }

    for (const method of OPEN) {
      it(`${method} still answers a non-admin`, async () => {
        await assert.doesNotReject(() => user.call(method, {}))
      })
    }

    // the lock must not cost admins the feature
    for (const method of RESTRICTED) {
      it(`${method} still answers an admin`, async () => {
        await assert.doesNotReject(() => admin.call(method, {}))
      })
    }
  })
})
