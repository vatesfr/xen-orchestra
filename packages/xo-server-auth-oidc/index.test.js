'use strict'

const { beforeEach, describe, it, mock } = require('node:test')
const assert = require('node:assert/strict')

let mockData
let mockXo
let authOidc

beforeEach(() => {
  mockData = { xoGroups: [] }

  mockXo = {
    getAllGroups: mock.fn(async () => mockData.xoGroups),
    createGroup: mock.fn(async group => {
      const newGroup = { id: mockData.xoGroups.length + 1, users: [], ...group }
      mockData.xoGroups.push(newGroup)
      return newGroup
    }),
    addUserToGroup: mock.fn(async (userId, groupId) => {
      const group = mockData.xoGroups.find(group => group.id === groupId)
      if (!group) throw new Error(`Group ${groupId} not found`)
      if (!group.users.includes(userId)) group.users.push(userId)
    }),
    removeUserFromGroup: mock.fn(async (userId, groupId) => {
      const group = mockData.xoGroups.find(group => group.id === groupId)
      if (!group) throw new Error(`Group ${groupId} not found`)
      if (group.users.includes(userId)) group.users.splice(group.users.indexOf(userId), 1)
    }),
  }

  authOidc = require('./index.js').default({ xo: mockXo })
})

describe('AuthOidc._synchronizeGroups', () => {
  it('synchronizeGroups should create the user groups and add the user', async () => {
    mockData.xoGroups = []
    const mockUser = { id: 'id1' }
    const mockOidcGroups = ['group-1', 'group-2']

    await authOidc._synchronizeGroups(mockUser, mockOidcGroups)

    // We created 2 groups and added 1 user to each.
    assert.equal(mockXo.createGroup.mock.calls.length, 2)
    assert.equal(mockXo.addUserToGroup.mock.calls.length, 2)
    assert.equal(mockXo.removeUserFromGroup.mock.calls.length, 0)

    assert.deepEqual(mockData.xoGroups, [
      { id: 1, users: ['id1'], name: 'group-1', provider: 'oidc' },
      { id: 2, users: ['id1'], name: 'group-2', provider: 'oidc' },
    ])
  })

  it('synchronizeGroups should not recreate existing groups but still add the user', async () => {
    mockData.xoGroups = [
      { id: 1, users: [], name: 'group-1', provider: 'oidc' },
      { id: 2, users: [], name: 'group-2', provider: 'oidc' },
    ]
    const mockUser = { id: 'id1' }
    const mockOidcGroups = ['group-1', 'group-2']

    await authOidc._synchronizeGroups(mockUser, mockOidcGroups)

    // We added 1 user to each group.
    assert.equal(mockXo.createGroup.mock.calls.length, 0)
    assert.equal(mockXo.addUserToGroup.mock.calls.length, 2)
    assert.equal(mockXo.removeUserFromGroup.mock.calls.length, 0)

    assert.deepEqual(mockData.xoGroups, [
      { id: 1, users: ['id1'], name: 'group-1', provider: 'oidc' },
      { id: 2, users: ['id1'], name: 'group-2', provider: 'oidc' },
    ])
  })

  it('synchronizeGroups should check the provider of the existing groups', async () => {
    mockData.xoGroups = [{ id: 1, users: [], name: 'group-1', provider: 'ldap' }]
    const mockUser = { id: 'id1' }
    const mockOidcGroups = ['group-1']

    await authOidc._synchronizeGroups(mockUser, mockOidcGroups)

    // We created 1 group and added 1 user to it.
    assert.equal(mockXo.createGroup.mock.calls.length, 1)
    assert.equal(mockXo.addUserToGroup.mock.calls.length, 1)
    assert.equal(mockXo.removeUserFromGroup.mock.calls.length, 0)

    assert.deepEqual(mockData.xoGroups, [
      { id: 1, users: [], name: 'group-1', provider: 'ldap' },
      { id: 2, users: ['id1'], name: 'group-1', provider: 'oidc' },
    ])
  })

  it('synchronizeGroups should remove user from groups he is not a part of', async () => {
    mockData.xoGroups = [
      { id: 1, users: ['id1'], name: 'group-1', provider: 'oidc' },
      { id: 2, users: [], name: 'group-2', provider: 'oidc' },
      { id: 3, users: [], name: 'group-3', provider: 'oidc' },
      { id: 4, users: ['id1'], name: 'group-4', provider: 'ldap' },
    ]
    const mockUser = { id: 'id1' }
    const mockOidcGroups = ['group-2']

    await authOidc._synchronizeGroups(mockUser, mockOidcGroups)

    // We removed the user from 1 group and added him to 1 group.
    assert.equal(mockXo.createGroup.mock.calls.length, 0)
    assert.equal(mockXo.addUserToGroup.mock.calls.length, 1)
    assert.equal(mockXo.removeUserFromGroup.mock.calls.length, 1)

    assert.deepEqual(mockData.xoGroups, [
      { id: 1, users: [], name: 'group-1', provider: 'oidc' },
      { id: 2, users: ['id1'], name: 'group-2', provider: 'oidc' },
      { id: 3, users: [], name: 'group-3', provider: 'oidc' },
      { id: 4, users: ['id1'], name: 'group-4', provider: 'ldap' },
    ])
  })
})

describe('the username', () => {
  const { hasUsername, resolveUsername } = require('./index.js')

  it('is found in the ID token, under the claim its profile field comes from', () => {
    assert.equal(hasUsername('username', { sub: 's', preferred_username: 'alice' }), true)
    assert.equal(hasUsername('email', { sub: 's', email: 'alice@example.org' }), true)
    assert.equal(hasUsername('displayName', { sub: 's', name: 'Alice' }), true)
    // a claim the profile does not map
    assert.equal(hasUsername('upn', { sub: 's', upn: 'alice@corp' }), true)
  })

  it('is missing from a thin ID token, which only has the minimal claims', () => {
    for (const usernameField of ['username', 'email', 'displayName']) {
      assert.equal(hasUsername(usernameField, { iss: 'https://op', sub: 's', aud: 'xo', exp: 1, iat: 0 }), false)
    }
  })

  it('comes from the userinfo response first, then from the ID token', () => {
    const claims = { sub: 's', preferred_username: 'from-token' }
    const idProfile = { id: 's', username: 'from-token' }
    const uiProfile = { id: 's', username: 'from-userinfo', _json: {} }
    assert.equal(resolveUsername('username', { claims, idProfile, uiProfile }), 'from-userinfo')
    assert.equal(resolveUsername('username', { claims, idProfile }), 'from-token')
  })

  it('reads emails and unmapped claims', () => {
    const uiProfile = { id: 's', emails: [{ value: 'alice@example.org' }], _json: { upn: 'alice@corp' } }
    assert.equal(
      resolveUsername('email', { claims: { sub: 's' }, idProfile: { id: 's' }, uiProfile }),
      'alice@example.org'
    )
    assert.equal(resolveUsername('upn', { claims: { sub: 's' }, idProfile: { id: 's' }, uiProfile }), 'alice@corp')
    assert.equal(resolveUsername('upn', { claims: { sub: 's', upn: 'bob@corp' }, idProfile: { id: 's' } }), 'bob@corp')
  })

  it('is undefined when neither source has it', () => {
    assert.equal(resolveUsername('username', { claims: { sub: 's' }, idProfile: { id: 's' } }), undefined)
  })
})

describe('the groups', () => {
  const { resolveGroups } = require('./index.js')

  it('come from the userinfo response first, then from the ID token, always as an array', () => {
    assert.deepEqual(resolveGroups({ claims: { groups: ['a'] }, uiProfile: { _json: { groups: ['b', 'c'] } } }), [
      'b',
      'c',
    ])
    assert.deepEqual(resolveGroups({ claims: { groups: 'a' } }), ['a'])
    assert.deepEqual(resolveGroups({ claims: {}, uiProfile: { _json: {} } }), [])
  })
})

describe('the passport strategy', () => {
  async function loadStrategy(conf) {
    let strategy
    const xo = {
      ...mockXo,
      registerPassportStrategy: registered => {
        strategy = registered
        return () => {}
      },
    }
    const plugin = require('./index.js').default({ xo })
    await plugin.configure(
      {
        clientID: 'xo',
        clientSecret: 'secret',
        advanced: {
          authorizationURL: 'https://op/authorize',
          issuer: 'https://op',
          tokenURL: 'https://op/token',
          usernameField: 'username',
          ...conf,
        },
      },
      { loaded: false }
    )
    await plugin.load()
    return strategy
  }

  it('asks the userinfo endpoint only when the ID token lacks the username', async () => {
    const strategy = await loadStrategy({ userInfoURL: 'https://op/userinfo' })
    assert.equal(strategy._skipUserProfile({}, { sub: 's' }), false)
    assert.equal(strategy._skipUserProfile({}, { sub: 's', preferred_username: 'alice' }), true)
  })

  it('never asks it when there is no userinfo endpoint', async () => {
    const strategy = await loadStrategy({})
    assert.equal(strategy._skipUserProfile({}, { sub: 's' }), true)
  })

  it('receives both profiles', async () => {
    const strategy = await loadStrategy({ userInfoURL: 'https://op/userinfo' })
    // see the arities handled by passport-openidconnect
    assert.equal(strategy._verify.length, 9)
  })
})

describe('a sign in', () => {
  const { createServer } = require('node:http')
  const { once } = require('node:events')

  const base64url = object => Buffer.from(JSON.stringify(object)).toString('base64url')

  // a minimal OpenID provider: its ID token carries `idTokenClaims`, its userinfo endpoint `userInfo`
  async function withProvider({ idTokenClaims, userInfo }, fn) {
    const userInfoCalls = []
    const server = createServer((req, res) => {
      res.setHeader('content-type', 'application/json')
      if (req.url === '/token') {
        const now = Math.floor(Date.now() / 1e3)
        const claims = { iss: issuer, aud: 'xo', iat: now, exp: now + 60, ...idTokenClaims }
        res.end(
          JSON.stringify({
            access_token: 'access-token',
            token_type: 'Bearer',
            id_token: `${base64url({ alg: 'none' })}.${base64url(claims)}.`,
          })
        )
      } else if (req.url === '/userinfo') {
        userInfoCalls.push(req.headers.authorization)
        res.end(JSON.stringify(userInfo))
      } else {
        res.statusCode = 404
        res.end('{}')
      }
    })
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const issuer = `http://127.0.0.1:${server.address().port}`
    try {
      return await fn({ issuer, userInfoCalls })
    } finally {
      server.close()
    }
  }

  // runs the callback of the authorization code flow, as if the browser came back from the provider
  async function signIn(issuer) {
    const registered = []
    let strategy
    const xo = {
      ...mockXo,
      registerPassportStrategy: s => {
        strategy = s
        return () => {}
      },
      registerUser2: async (provider, { user }) => {
        registered.push({ provider, ...user })
        return { id: 'xo-user' }
      },
    }
    const plugin = require('./index.js').default({ xo })
    await plugin.configure(
      {
        clientID: 'xo',
        clientSecret: 'secret',
        advanced: {
          authorizationURL: `${issuer}/authorize`,
          callbackURL: '/signin/oidc/callback',
          issuer,
          tokenURL: `${issuer}/token`,
          userInfoURL: `${issuer}/userinfo`,
          usernameField: 'username',
        },
      },
      { loaded: false }
    )
    await plugin.load()

    await new Promise((resolve, reject) => {
      strategy.success = resolve
      strategy.fail = info => reject(new Error(`failed: ${JSON.stringify(info)}`))
      strategy.error = reject
      strategy.authenticate(
        {
          connection: {},
          headers: { host: 'xo.example.org' },
          query: { code: 'code', state: 'handle' },
          session: { 'openidconnect:127.0.0.1': { state: { handle: 'handle' } } },
          url: '/signin/oidc/callback?code=code&state=handle',
        },
        {}
      )
    })
    return registered
  }

  it('reads the username and the groups from the userinfo endpoint when the ID token is thin', async () => {
    await withProvider(
      {
        idTokenClaims: { sub: 'subject' },
        userInfo: { sub: 'subject', preferred_username: 'alice', groups: ['admins'] },
      },
      async ({ issuer, userInfoCalls }) => {
        const registered = await signIn(issuer)
        assert.deepEqual(userInfoCalls, ['Bearer access-token'])
        assert.deepEqual(registered, [{ provider: 'oidc:' + issuer, id: 'subject', name: 'alice' }])
        assert.deepEqual(
          mockData.xoGroups.map(group => group.name),
          ['admins']
        )
      }
    )
  })

  it('does not ask the userinfo endpoint when the ID token has the username', async () => {
    await withProvider(
      { idTokenClaims: { sub: 'subject', preferred_username: 'bob' }, userInfo: {} },
      async ({ issuer, userInfoCalls }) => {
        const registered = await signIn(issuer)
        assert.deepEqual(userInfoCalls, [])
        assert.deepEqual(registered, [{ provider: 'oidc:' + issuer, id: 'subject', name: 'bob' }])
      }
    )
  })
})
