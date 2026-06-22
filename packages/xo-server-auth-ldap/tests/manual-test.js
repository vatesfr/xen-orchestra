'use strict'

// Run: node manual-test.js
// Requires docker-compose up (primary on localhost:1389)

const { test } = require('node:test')
const assert = require('node:assert/strict')

const { createXoMock } = require('./xo-mock')

const pluginModule = require('../dist')
const createPlugin = pluginModule.default ?? pluginModule

const PRIMARY_CONFIG = {
  uri: 'ldap://localhost:1389',
  base: 'dc=example,dc=com',
  bind: { dn: 'cn=admin,dc=example,dc=com', password: 'adminpassword' },
  filter: '(uid={{name}})',
  userIdAttribute: 'uid',
  groups: {
    base: 'ou=groups,dc=example,dc=com',
    filter: '(objectClass=posixGroup)',
    idAttribute: 'cn',
    displayNameAttribute: 'cn',
    membersMapping: { groupAttribute: 'memberUid', userAttribute: 'uid' },
  },
}

async function makePlugin(config = PRIMARY_CONFIG) {
  const xo = createXoMock()
  const plugin = createPlugin({ xo })
  await plugin.configure(config)
  return { plugin, xo }
}

// ─── Authentication ───────────────────────────────────────────────────────────

test('authenticate alice with correct password', async () => {
  const { plugin } = await makePlugin()
  const result = await plugin._authenticate({ username: 'alice', password: 'alice123' })
  assert.ok(result?.userId, 'should return userId')
})

test('authenticate bob with correct password', async () => {
  const { plugin } = await makePlugin()
  const result = await plugin._authenticate({ username: 'bob', password: 'bob123' })
  assert.ok(result?.userId, 'should return userId')
})

test('reject wrong password', async () => {
  const { plugin } = await makePlugin()
  const result = await plugin._authenticate({ username: 'alice', password: 'wrong' })
  assert.equal(result, null)
})

test('reject unknown user', async () => {
  const { plugin } = await makePlugin()
  const result = await plugin._authenticate({ username: 'nobody', password: 'pass' })
  assert.equal(result, null)
})

test('reject missing credentials', async () => {
  const { plugin } = await makePlugin()
  const result = await plugin._authenticate({ username: undefined, password: undefined })
  assert.equal(result, null)
})

// ─── Group sync on login ──────────────────────────────────────────────────────

test('alice added to developers group on login', async () => {
  const { plugin, xo } = await makePlugin()
  await plugin._authenticate({ username: 'alice', password: 'alice123' })
  const groups = [...xo.groups.values()]
  assert.equal(groups.length, 1)
  assert.equal(groups[0].name, 'developers')
  assert.equal(groups[0].users.length, 1)
})

test('second login does not duplicate alice in group', async () => {
  const { plugin, xo } = await makePlugin()
  await plugin._authenticate({ username: 'alice', password: 'alice123' })
  await plugin._authenticate({ username: 'alice', password: 'alice123' })
  const [devGroup] = [...xo.groups.values()]
  assert.equal(devGroup.users.length, 1)
})

// ─── Full group sync ──────────────────────────────────────────────────────────

test('full sync adds both alice and bob to developers', async () => {
  const { plugin, xo } = await makePlugin()
  // Register both users first so full sync can resolve them
  await plugin._authenticate({ username: 'alice', password: 'alice123' })
  await plugin._authenticate({ username: 'bob', password: 'bob123' })
  // Reset group membership to test full sync from scratch
  for (const g of xo.groups.values()) g.users = []
  await plugin._synchronizeGroups()
  const [devGroup] = [...xo.groups.values()]
  assert.equal(devGroup.users.length, 2)
})

test('full sync deletes stale LDAP groups', async () => {
  const { plugin, xo } = await makePlugin()
  xo.groups.set('grp-stale', {
    id: 'grp-stale',
    name: 'oldteam',
    provider: 'ldap',
    providerGroupId: 'oldteam',
    users: [],
  })
  await plugin._synchronizeGroups()
  assert.equal(xo.groups.has('grp-stale'), false)
})
