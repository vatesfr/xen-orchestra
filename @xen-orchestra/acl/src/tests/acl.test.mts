import { test, suite } from 'node:test'
import assert from 'node:assert'
import type { Branded } from '@vates/types/common'
import type { XoUser } from '@vates/types/xo'

import { Privilege } from '../class/privilege.mjs'
import type { Privilege as TPrivilege } from '../index.mjs'
import { filterObjectsWithPrivilege, getMissingPrivileges, hasPrivilegeOn, hasPrivileges } from '../index.mjs'

suite('Privilege.checkActionIsValid behavior', () => {
  console.log('suite setup')
  test('throw on invalid resource', () => {
    // @ts-expect-error test invalid action
    assert.throws(() => Privilege.checkActionIsValid('foo', 'read'))
  })

  test('throw on invalid action', () => {
    // @ts-expect-error test invalid action
    assert.throws(() => Privilege.checkActionIsValid('vm', 'foo:vm'))
  })

  test('should work', () => {
    assert.doesNotThrow(() => Privilege.checkActionIsValid('vm', 'read'))
  })
})

suite('Privilege.match behavior', () => {
  const privilege = new Privilege({ action: 'read', resource: 'vm' })
  const object = { id: 1, name_label: 'foo' }

  test('Should not match because of the action', () => {
    assert.strictEqual(privilege.match({ resource: 'vm', action: 'start', object }), false)
  })

  test('Should not match because of the resource', () => {
    assert.strictEqual(privilege.match({ resource: 'host', action: 'read', object }), false)
  })

  test('Should match', () => {
    assert.strictEqual(privilege.match({ resource: 'vm', action: 'read', object }), true)
  })

  test('Should match even if the action is not equal to the action privilege', () => {
    const shutdownPrivilege = new Privilege({ action: 'shutdown', resource: 'vm' })
    assert.strictEqual(shutdownPrivilege.match({ resource: 'vm', action: 'shutdown:clean', object }), true)
  })

  test('Should match because the action is *', () => {
    const vmPrivilege = new Privilege({ action: '*', resource: 'vm' })
    assert.strictEqual(vmPrivilege.match({ action: 'reboot:hard', resource: 'vm', object: object }), true)
  })

  test('Should not match due to insufficient privilege', () => {
    const cleanShutdownPrivilege = new Privilege({ action: 'shutdown:clean', resource: 'vm' })
    assert.strictEqual(cleanShutdownPrivilege.match({ resource: 'vm', action: 'shutdown', object }), false)
  })
})

suite('ACL V2 behavior', async () => {
  // === Setup ===
  const admin = {
    id: '1' as XoUser['id'],
    groups: [],
    permission: 'admin',
    email: 'admin@admin.net',
    preferences: {},
  }

  const user = {
    id: '2' as XoUser['id'],
    groups: [],
    permission: 'user',
    email: 'user@user.net',
    preferences: {},
  }

  const privilegeId = 'fake-priv-test-id' as Branded<'acl-v2-privilege'>
  const roleId = 'fake-role-test-id' as Branded<'acl-v2-role'>

  // === Objects
  const poolWithoutPrivilege = { id: 'pool-id' }
  const alpineVm = { id: 'alpine', creation: { creator: admin.id } }
  const almaVm = { id: 'alma', creation: { creator: user.id } }
  const xoaVm = { id: 'xoa' }
  const template = { id: 'template-id', $pool: '1' }
  const templateDeny = { id: 'template-deny-id', $pool: '2' }
  const vdis = [
    { id: 'vdi-1', $SR: '2' },
    { id: 'vdi-2', $SR: '2' },
  ]
  const vdisMultipleSrs = [
    { id: 'vdi-1', $SR: '1' },
    { id: 'vdi-2', $SR: '2' },
  ]
  const vifs = [{ id: 'vif-1', $network: '1' }]
  const iso = { id: 'iso-vdi-id', $SR: '3' }
  const hostAffinity = { id: 'affinity-host-id', $pool: '1' }

  // === DB Privileges
  const vmRead = { id: privilegeId, action: 'read', resource: 'vm', effect: 'allow', roleId } satisfies TPrivilege<'vm'>
  const vmCleanShutdown = {
    id: privilegeId,
    action: 'shutdown:clean',
    resource: 'vm',
    selector: { creation: { creator: user.id } },
    effect: 'allow',
    roleId,
  } satisfies TPrivilege<'vm'>
  const xoaVmDenyRead = {
    id: privilegeId,
    action: 'read',
    resource: 'vm',
    effect: 'deny',
    selector: { id: xoaVm.id },
    roleId,
  } satisfies TPrivilege<'vm'>
  const vdiCreate = {
    id: privilegeId,
    action: 'create',
    resource: 'vdi',
    selector: { $SR: '2' },
    effect: 'allow',
    roleId,
  } satisfies TPrivilege<'vdi'>
  const vifCreate = {
    id: privilegeId,
    action: 'create',
    resource: 'vif',
    effect: 'allow',
    roleId,
  } satisfies TPrivilege<'vif'>
  const templateInstantiate = {
    id: privilegeId,
    action: 'instantiate',
    resource: 'vm-template',
    effect: 'allow',
    roleId,
  } satisfies TPrivilege<'vm-template'>
  const templateInstantiateDeny = {
    id: privilegeId,
    action: 'instantiate',
    resource: 'vm-template',
    selector: { $pool: '2' },
    effect: 'deny',
    roleId,
  } satisfies TPrivilege<'vm-template'>
  const isoVdiUse = {
    id: privilegeId,
    action: 'boot',
    resource: 'vdi',
    selector: { $SR: '3' },
    effect: 'allow',
    roleId,
  } satisfies TPrivilege<'vdi'>
  const hostVm = {
    id: privilegeId,
    action: 'allow-vm',
    resource: 'host',
    effect: 'allow',
    roleId,
  } satisfies TPrivilege<'host'>

  const allPrivileges = [
    vmRead,
    vmCleanShutdown,
    xoaVmDenyRead,
    vdiCreate,
    vifCreate,
    templateInstantiate,
    templateInstantiateDeny,
    isoVdiUse,
    hostVm,
  ]

  // === Test ===
  suite('hasPrivilegeOn behavior', () => {
    test('Should always return true for admin', () => {
      assert.strictEqual(
        hasPrivilegeOn<'pool'>({
          user: admin,
          action: 'read',
          resource: 'pool',
          objects: poolWithoutPrivilege,
          userPrivileges: allPrivileges,
        }),
        true
      )
    })

    test('Should return false by default for non admin', () => {
      assert.strictEqual(
        hasPrivilegeOn({
          user,
          action: 'read',
          resource: 'pool',
          objects: poolWithoutPrivilege,
          userPrivileges: allPrivileges,
        }),
        false
      )
    })

    test('Should return true if user has privilege', () => {
      assert.strictEqual(
        hasPrivilegeOn({ user, action: 'read', resource: 'vm', objects: alpineVm, userPrivileges: allPrivileges }),
        true
      )
    })

    test('Should return false if user have a both deny and allow privileges', () => {
      assert.strictEqual(
        hasPrivilegeOn({ user, action: 'read', resource: 'vm', objects: xoaVm, userPrivileges: allPrivileges }),
        false
      )
    })

    test('Should handle multiple and single object', () => {
      assert.strictEqual(
        hasPrivilegeOn({
          user,
          action: 'read',
          resource: 'vm',
          objects: [alpineVm, almaVm],
          userPrivileges: allPrivileges,
        }),
        true
      )
      assert.strictEqual(
        hasPrivilegeOn({
          user,
          action: 'read',
          resource: 'vm',
          objects: [alpineVm, almaVm, xoaVm],
          userPrivileges: allPrivileges,
        }),
        false
      )
    })

    test('Should allow clean shutdown only own VMs', () => {
      assert.strictEqual(
        hasPrivilegeOn({
          user,
          action: 'shutdown:clean',
          resource: 'vm',
          objects: almaVm,
          userPrivileges: allPrivileges,
        }),
        true
      )
      assert.strictEqual(
        hasPrivilegeOn({
          user,
          action: 'shutdown:clean',
          resource: 'vm',
          objects: [almaVm, alpineVm],
          userPrivileges: allPrivileges,
        }),
        false
      )
    })
  })

  suite('getMissingPrivileges behavior', () => {
    test('Should return empty array if no missing privileges', () => {
      const missingPrivileges = getMissingPrivileges(
        [
          { user, action: 'shutdown:clean', resource: 'vm', objects: almaVm },
          { user, action: 'instantiate', resource: 'vm-template', objects: template },
          { user, action: 'create', resource: 'vdi', objects: vdis },
          { user, action: 'create', resource: 'vif', objects: vifs },
          { user, action: 'boot', resource: 'vdi', objects: iso },
          { user, action: 'allow-vm', resource: 'host', objects: hostAffinity },
        ],
        allPrivileges
      )

      assert.strictEqual(missingPrivileges.length, 0)
    })

    test('Should return only missing privileges', () => {
      const missingPrivileges = getMissingPrivileges(
        [
          { user, action: 'instantiate', resource: 'vm-template', objects: template },
          { user, action: 'create', resource: 'vdi', objects: vdis },
          { user, action: 'create', resource: 'vif', objects: vifs },
          { user, action: 'boot', resource: 'vdi', objects: iso },
          { user, action: 'allow-vm', resource: 'host', objects: hostAffinity },
          { user, action: 'read', resource: 'pool', objects: poolWithoutPrivilege },
          { user, action: '*', resource: 'pool', objects: poolWithoutPrivilege },
        ],
        allPrivileges
      )

      assert.strictEqual(missingPrivileges.length, 2)
    })
  })

  suite('hasPrivileges behavior', () => {
    test('Should return false if at least one privilege deny', () => {
      const result = hasPrivileges(
        [
          { user, action: 'instantiate', resource: 'vm-template', objects: templateDeny },
          { user, action: 'create', resource: 'vdi', objects: vdis },
          { user, action: 'create', resource: 'vif', objects: vifs },
          { user, action: 'boot', resource: 'vdi', objects: iso },
          { user, action: 'allow-vm', resource: 'host', objects: hostAffinity },
        ],
        allPrivileges
      )
      assert.strictEqual(result, false)
    })
    test("Should return false if at least one privilege didn't match", () => {
      const result = hasPrivileges(
        [
          { user, action: 'instantiate', resource: 'vm-template', objects: template },
          { user, action: 'create', resource: 'vdi', objects: vdisMultipleSrs },
          { user, action: 'create', resource: 'vif', objects: vifs },
          { user, action: 'boot', resource: 'vdi', objects: iso },
          { user, action: 'allow-vm', resource: 'host', objects: hostAffinity },
        ],
        allPrivileges
      )
      assert.strictEqual(result, false)
    })
  })

  suite('filterObjectsWithPrivilege behavior', () => {
    test('Should return only objects that match privileges', () => {
      let vms = [almaVm, alpineVm, xoaVm, xoaVm]
      assert.strictEqual(vms.length, 4)
      vms = filterObjectsWithPrivilege({
        user,
        action: 'read',
        resource: 'vm',
        objects: vms,
        userPrivileges: allPrivileges,
      })
      assert.strictEqual(vms.length, 2)
    })
  })
})
