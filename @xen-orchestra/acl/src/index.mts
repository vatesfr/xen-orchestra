import assert from 'node:assert'
import { XoUser } from '@vates/types/xo'

import { Privilege } from './class/privilege.mjs'
import { Role } from './class/role.mjs'

export function hasPrivileges({
  user,
  action,
  resource,
  object,
}: {
  user: XoUser
  action: Privilege['action']
  resource: Privilege['resource']
  object?: unknown
}) {
  // Function that will be called outside of the module
  // We cannot be sure types are respected
  assert.strictEqual(typeof user?.id, 'string')
  assert.strictEqual(typeof action, 'string')
  assert.strictEqual(typeof resource, 'string')
  Privilege.checkActionIsValid(action, resource)

  if (user.permission === 'admin') {
    return true
  }

  /**
   * Recup dans la BDD les privilèges
   * - attaché a l'utilisateur
   * - attaché au gorups de l'utilisateurs
   * - attaché à la resource
   */
  // BDD operation
  const _priv: Privilege[] = [readVm, readHost, readPool, createVm, notCreateVmOnProd, snapshotVm, deleteSnapshot]
  const privileges = _priv.filter(p => p.resource === resource)
  //

  const privilegesThatMatch = privileges.filter(p => p.match({ action, resource, object }))
  console.log({ privilegesThatMatch })
  if (privilegesThatMatch.length === 0 || privilegesThatMatch.some(p => p.effect === 'deny')) {
    return false
  }

  return true
}

// EXAMPLE
const foo = {
  id: '1',
  groups: ['2'],
  permission: 'user',
} as XoUser

// user's roles
const readOnly = new Role('read only')
const vmCreator = new Role('vm-creator')

const readVm = new Privilege({ action: 'read:*', resource: 'vm', effect: 'allow', roleId: readOnly.id })
const readHost = new Privilege({ action: 'read:*', resource: 'host', effect: 'allow', roleId: readOnly.id })
const readPool = new Privilege({ action: 'read:*', resource: 'pool', effect: 'allow', roleId: readOnly.id })

const createVm = new Privilege({ action: 'create:vm', resource: 'pool', effect: 'allow', roleId: vmCreator.id })
const notCreateVmOnProd = new Privilege({
  action: '*',
  resource: 'pool',
  effect: 'deny',
  roleId: vmCreator.id,
  selector: { id: '123' },
})

const snapshotVm = new Privilege({
  action: 'create:snapshot',
  resource: 'vm',
  effect: 'allow',
  roleId: vmCreator.id,
  selector: { id: '123' },
})

const deleteSnapshot = new Privilege({
  action: 'delete',
  resource: 'vm-snapshot',
  effect: 'allow',
  roleId: vmCreator.id,
  selector: { snapshot_of: '123' },
})

// // create_vm endpoint
const pool = { id: '123' }
console.log(
  'create_vm check permission: ',
  hasPrivileges({ user: foo, action: 'create:vm', resource: 'pool', object: pool })
)

// // create snapshot
const vm = { id: '123' }
console.log(
  'create snapshot check permission: ',
  hasPrivileges({ user: foo, action: 'create:snapshot', resource: 'vm', object: vm })
)

// delete snapshot
const snapshot = { id: '555', snapshot_of: vm.id }
console.log(
  'delete snapshot check permission: ',
  hasPrivileges({ user: foo, action: 'delete', resource: 'vm-snapshot', object: snapshot })
)

// questions:
/**
 * should we have to do:
 *
 * action: create:vm, resource: pool
 * action: delete:vm, resource: pool
 * action: update:vm:name_label resource: pool ??
 * OR
 * action: create, resource: vm
 * action: delete, resource: vm
 * action: update:name_label, resource: vm
 * OR
 * for object creation, always use the parent, as an object is ALWAYS inside another one
 * action: create:vm, resource: pool
 * action: delete, resource: vm
 * action: update:name_label, resource: vm
 *
 * IMO, second approch is have a better consistency
 *
 */
