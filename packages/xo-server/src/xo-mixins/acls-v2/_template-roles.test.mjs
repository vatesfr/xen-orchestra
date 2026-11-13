import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { hasPrivilegeOn } from '@xen-orchestra/acl'

import * as TEMPLATES from './template-roles.mjs'
import { ADMINISTRATOR, FIREWALL_ADMINISTRATOR, FIREWALL_OPERATOR, REAL_ONLY_ALL } from './template-roles.mjs'

const USER = { id: 'user', permission: 'none' }
const POOL = { id: 'pool-1', type: 'pool', $pool: 'pool-1', name_label: 'prod', tags: [] }

// what a user whose only role is a copy of this template may do
const allows = (template, resource, action, object = { id: 'object', $pool: POOL.id }) =>
  hasPrivilegeOn({
    user: USER,
    resource,
    action,
    objects: object,
    userPrivileges: template.privileges.map((privilege, i) => ({ ...privilege, id: String(i), roleId: 'role' })),
  })

describe('template roles', () => {
  const templates = Object.values(TEMPLATES)

  it('have distinct ids and names', () => {
    assert.equal(new Set(templates.map(template => template.roleTemplateId)).size, templates.length)
    assert.equal(new Set(templates.map(template => template.name)).size, templates.length)
  })

  it('only grant actions their resource supports', () => {
    for (const template of templates) {
      // evaluating a privilege throws on an action or a resource the ACL package doesn't know
      assert.doesNotThrow(() => allows(template, 'vm', 'read'), template.name)
    }
  })
})

describe('Firewall administrator', () => {
  it('may do everything with the firewall', () => {
    for (const action of ['read', 'publish', 'membership', 'quarantine:add', 'quarantine:remove']) {
      assert.equal(allows(FIREWALL_ADMINISTRATOR, 'firewall', action, POOL), true, action)
    }
  })

  it("may see what the firewall pages show, and change VMs' and networks' tags", () => {
    for (const resource of ['pool', 'host', 'network', 'vm', 'vif']) {
      assert.equal(allows(FIREWALL_ADMINISTRATOR, resource, 'read'), true, resource)
    }
    assert.equal(allows(FIREWALL_ADMINISTRATOR, 'vm', 'update:tags'), true)
    assert.equal(allows(FIREWALL_ADMINISTRATOR, 'network', 'update:tags'), true)
  })

  it('may not change the infrastructure otherwise', () => {
    assert.equal(allows(FIREWALL_ADMINISTRATOR, 'vm', 'start'), false)
    assert.equal(allows(FIREWALL_ADMINISTRATOR, 'pool', 'update:tags'), false)
    assert.equal(allows(FIREWALL_ADMINISTRATOR, 'vif', 'update:lockingMode'), false)
  })
})

describe('Firewall operator', () => {
  it('may see the firewall, quarantine a VM and lift its quarantine', () => {
    for (const action of ['read', 'quarantine:add', 'quarantine:remove']) {
      assert.equal(allows(FIREWALL_OPERATOR, 'firewall', action, POOL), true, action)
    }
  })

  it('may neither publish nor change group membership', () => {
    assert.equal(allows(FIREWALL_OPERATOR, 'firewall', 'publish', POOL), false)
    assert.equal(allows(FIREWALL_OPERATOR, 'firewall', 'membership', POOL), false)
  })

  it("may see what the firewall pages show, and change VMs' tags only", () => {
    for (const resource of ['pool', 'host', 'network', 'vm', 'vif']) {
      assert.equal(allows(FIREWALL_OPERATOR, resource, 'read'), true, resource)
    }
    assert.equal(allows(FIREWALL_OPERATOR, 'vm', 'update:tags'), true)
    assert.equal(allows(FIREWALL_OPERATOR, 'network', 'update:tags'), false)
  })
})

describe('Administrator', () => {
  it('may do everything with the firewall', () => {
    for (const action of ['read', 'publish', 'membership', 'quarantine:add', 'quarantine:remove']) {
      assert.equal(allows(ADMINISTRATOR, 'firewall', action, POOL), true, action)
    }
  })
})

describe('Read only', () => {
  it('may see the firewall, and do nothing else with it', () => {
    assert.equal(allows(REAL_ONLY_ALL, 'firewall', 'read', POOL), true)
    for (const action of ['publish', 'membership', 'quarantine:add', 'quarantine:remove']) {
      assert.equal(allows(REAL_ONLY_ALL, 'firewall', action, POOL), false, action)
    }
  })
})
