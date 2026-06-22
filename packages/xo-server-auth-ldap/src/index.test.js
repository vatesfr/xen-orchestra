import { mock, test, beforeEach, describe } from 'node:test'
import assert from 'node:assert/strict'
import createPlugin from './index.js'
import { Client } from 'ldapts'

const CONNECT_TIMEOUT_MS = 5000

let startTLSBehaviors = []
let startTLSInstances = []
let unbindInstances = []

beforeEach(() => {
  mock.restoreAll()
  startTLSBehaviors = []
  startTLSInstances = []
  unbindInstances = []
  mock.method(Client.prototype, 'startTLS', async function () {
    startTLSInstances.push(this)
    const behavior = startTLSBehaviors.shift() ?? {}
    if (behavior.startTLSError !== undefined) throw behavior.startTLSError
    if (behavior.startTLSHang) return new Promise(() => {})
  })
  mock.method(Client.prototype, 'unbind', async function () {
    unbindInstances.push(this)
  })
})

function tcpError(code) {
  const err = new Error(code)
  err.code = code
  return err
}

function aggregateError(codes) {
  const err = new AggregateError(codes.map(tcpError), 'all addresses failed')
  return err
}

function makePlugin({
  xo = undefined,
  url = 'ldap://primary',
  failoverUris = [],
  startTls = true,
  tlsOptions = {},
  credentials = undefined,
  groupsConfig = undefined,
} = {}) {
  const plugin = createPlugin({ xo })
  plugin._primaryDomain = {
    isPrimary: true,
    uris: [url, ...failoverUris],
    tlsOptions,
    startTls,
    credentials,
    groupsConfig,
    provider: 'ldap',
  }
  plugin._groupsConfig = groupsConfig
  return plugin
}

// StartTLS-level failover (ldaps:// / StartTLS)

test('retries through the full failoverUris list when each URI throws a FAILOVER_ERRORS code', async () => {
  const plugin = makePlugin({ failoverUris: ['ldap://backup1', 'ldap://backup2'] })
  startTLSBehaviors = [
    { startTLSError: tcpError('ECONNREFUSED') },
    { startTLSError: tcpError('ETIMEDOUT') },
    { startTLSError: tcpError('EHOSTUNREACH') },
  ]

  await assert.rejects(() => plugin._connectAndBind())
  assert.equal(startTLSInstances.length, 3)
  assert.equal(startTLSInstances[0].clientOptions.url, 'ldap://primary')
  assert.equal(startTLSInstances[1].clientOptions.url, 'ldap://backup1')
  assert.equal(startTLSInstances[2].clientOptions.url, 'ldap://backup2')
})

test('returns the first client that succeeds without trying remaining URIs', async () => {
  const plugin = makePlugin({ failoverUris: ['ldap://backup1', 'ldap://backup2'] })
  startTLSBehaviors = [{ startTLSError: tcpError('ECONNREFUSED') }]

  const client = await plugin._connectAndBind()
  assert.equal(startTLSInstances.length, 2)
  assert.equal(client.clientOptions.url, 'ldap://backup1')
})

test('does not retry when error code is not in FAILOVER_ERRORS', async () => {
  const plugin = makePlugin({ failoverUris: ['ldap://backup1'] })
  startTLSBehaviors = [{ startTLSError: tcpError('INVALID_CREDENTIALS') }]

  await assert.rejects(() => plugin._connectAndBind(), { code: 'INVALID_CREDENTIALS' })
  assert.equal(startTLSInstances.length, 1)
})

test('throws the last error when all URIs are exhausted', async () => {
  const plugin = makePlugin({ failoverUris: ['ldap://backup1'] })
  const lastError = tcpError('ETIMEDOUT')
  startTLSBehaviors = [{ startTLSError: tcpError('ECONNREFUSED') }, { startTLSError: lastError }]

  await assert.rejects(
    () => plugin._connectAndBind(),
    err => err === lastError
  )
})

test('treats a hanging connect as a failover error (our timeout fires, not ldapts codeless)', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const plugin = makePlugin({ failoverUris: ['ldap://backup1'] })
  startTLSBehaviors = [{ startTLSHang: true }]

  const promise = plugin._connectAndBind()
  t.mock.timers.tick(CONNECT_TIMEOUT_MS + 1)
  const client = await promise
  assert.equal(startTLSInstances.length, 2)
  assert.equal(client.clientOptions.url, 'ldap://backup1')
})

test('calls unbind() on a client whose startTLS throws a TCP error', async () => {
  const plugin = makePlugin({ failoverUris: ['ldap://backup1'] })
  startTLSBehaviors = [{ startTLSError: tcpError('ECONNREFUSED') }]

  const client = await plugin._connectAndBind()
  assert.equal(unbindInstances.length, 1)
  assert.equal(unbindInstances[0], startTLSInstances[0])
  assert.notEqual(client, startTLSInstances[0])
})

// Bind-level failover (plain ldap://, lazy connection)

describe('bind-level failover', () => {
  let bindInstances = []
  let bindBehaviors = []

  beforeEach(() => {
    bindInstances = []
    bindBehaviors = []
    mock.method(Client.prototype, 'bind', async function () {
      bindInstances.push(this)
      const behavior = bindBehaviors.shift() ?? {}
      if (behavior.bindError !== undefined) throw behavior.bindError
    })
  })

  test('retries next URI when plain ldap:// bind throws ECONNREFUSED', async () => {
    const plugin = makePlugin({
      startTls: false,
      failoverUris: ['ldap://backup1'],
      credentials: { dn: 'cn=admin,dc=example,dc=com', password: 'secret' },
    })
    bindBehaviors = [{ bindError: tcpError('ECONNREFUSED') }]

    const client = await plugin._connectAndBind()
    assert.equal(bindInstances.length, 2)
    assert.equal(client.clientOptions.url, 'ldap://backup1')
  })

  test('retries next URI when plain ldap:// bind throws AggregateError', async () => {
    const plugin = makePlugin({
      startTls: false,
      failoverUris: ['ldap://backup1'],
      credentials: { dn: 'cn=admin,dc=example,dc=com', password: 'secret' },
    })
    bindBehaviors = [{ bindError: aggregateError(['ECONNREFUSED', 'ECONNREFUSED']) }]

    const client = await plugin._connectAndBind()
    assert.equal(bindInstances.length, 2)
    assert.equal(client.clientOptions.url, 'ldap://backup1')
  })

  test('does not retry on bind error unrelated to TCP', async () => {
    const plugin = makePlugin({
      startTls: false,
      failoverUris: ['ldap://backup1'],
      credentials: { dn: 'cn=admin,dc=example,dc=com', password: 'secret' },
    })
    bindBehaviors = [{ bindError: tcpError('INVALID_CREDENTIALS') }]

    await assert.rejects(() => plugin._connectAndBind(), { code: 'INVALID_CREDENTIALS' })
    assert.equal(bindInstances.length, 1)
  })
})

// ===================================================================

describe('AuthLdap._synchronizeGroups', () => {
  let mockLdapGroups
  let mockXo
  let mockData
  let syncPlugin

  beforeEach(() => {
    mock.restoreAll()
    mockLdapGroups = []
    mockData = { xoGroups: [] }

    mock.method(Client.prototype, 'startTLS', async function () {})
    mock.method(Client.prototype, 'bind', async function () {})
    mock.method(Client.prototype, 'search', async function () {
      return { searchEntries: mockLdapGroups }
    })
    mock.method(Client.prototype, 'unbind', async function () {})

    mockXo = {
      getAllGroups: mock.fn(async () => [...mockData.xoGroups]),
      createGroup: mock.fn(async group => {
        const newGroup = { id: mockData.xoGroups.length + 1, users: [], ...group }
        mockData.xoGroups.push(newGroup)
        return newGroup
      }),
      updateGroup: mock.fn(async (id, data) => {
        const group = mockData.xoGroups.find(g => g.id === id)
        if (group) Object.assign(group, data)
      }),
      getGroup: mock.fn(async id => mockData.xoGroups.find(g => g.id === id)),
      addUserToGroup: mock.fn(async (userId, groupId) => {
        const group = mockData.xoGroups.find(g => g.id === groupId)
        if (group && !group.users.includes(userId)) group.users.push(userId)
      }),
      removeUserFromGroup: mock.fn(async (userId, groupId) => {
        const group = mockData.xoGroups.find(g => g.id === groupId)
        if (group) group.users = group.users.filter(id => id !== userId)
      }),
      deleteGroup: mock.fn(async id => {
        mockData.xoGroups = mockData.xoGroups.filter(g => g.id !== id)
      }),
      getAllUsers: mock.fn(async () => []),
    }

    syncPlugin = makePlugin({
      xo: mockXo,
      url: 'ldap://test',
      startTls: false,
      groupsConfig: {
        base: 'ou=groups,dc=example,dc=com',
        filter: '(objectClass=groupOfNames)',
        idAttribute: 'gid',
        displayNameAttribute: 'cn',
        membersMapping: { groupAttribute: 'memberUid', userAttribute: 'uid' },
      },
    })
  })

  test('creates XO group and adds user when LDAP group has no XO counterpart', async () => {
    mockLdapGroups = [{ gid: 'gid1', cn: 'Group One', memberUid: ['uid1'] }]

    await syncPlugin._synchronizeGroups({ id: 'user1' }, 'uid1')

    assert.equal(mockXo.createGroup.mock.callCount(), 1)
    assert.equal(mockXo.addUserToGroup.mock.callCount(), 1)
    assert.deepEqual(mockData.xoGroups, [
      { id: 1, users: ['user1'], name: 'Group One', provider: 'ldap', providerGroupId: 'gid1' },
    ])
  })

  test('reuses existing XO group and adds user without creating a new one', async () => {
    mockData.xoGroups = [{ id: 1, users: [], name: 'Group One', provider: 'ldap', providerGroupId: 'gid1' }]
    mockLdapGroups = [{ gid: 'gid1', cn: 'Group One', memberUid: ['uid1'] }]

    await syncPlugin._synchronizeGroups({ id: 'user1' }, 'uid1')

    assert.equal(mockXo.createGroup.mock.callCount(), 0)
    assert.equal(mockXo.addUserToGroup.mock.callCount(), 1)
    assert.deepEqual(mockData.xoGroups, [
      { id: 1, users: ['user1'], name: 'Group One', provider: 'ldap', providerGroupId: 'gid1' },
    ])
  })

  test('does not add user to LDAP groups they are not a member of', async () => {
    mockLdapGroups = [
      { gid: 'gid1', cn: 'Group One', memberUid: ['uid2'] },
      { gid: 'gid2', cn: 'Group Two', memberUid: ['uid1'] },
    ]

    await syncPlugin._synchronizeGroups({ id: 'user1' }, 'uid1')

    assert.equal(mockXo.createGroup.mock.callCount(), 1)
    assert.equal(mockXo.addUserToGroup.mock.callCount(), 1)
    assert.deepEqual(mockData.xoGroups, [
      { id: 1, users: ['user1'], name: 'Group Two', provider: 'ldap', providerGroupId: 'gid2' },
    ])
  })

  test('skips LDAP group when an XO group with the same name already exists under a different provider', async () => {
    mockData.xoGroups = [{ id: 1, users: [], name: 'Group One', provider: 'oidc' }]
    mockLdapGroups = [{ gid: 'gid1', cn: 'Group One', memberUid: ['uid1'] }]

    await syncPlugin._synchronizeGroups({ id: 'user1' }, 'uid1')

    assert.equal(mockXo.createGroup.mock.callCount(), 0)
    assert.equal(mockXo.addUserToGroup.mock.callCount(), 0)
    assert.deepEqual(mockData.xoGroups, [{ id: 1, users: [], name: 'Group One', provider: 'oidc' }])
  })
})
