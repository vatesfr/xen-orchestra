import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { invalidCredentials, noSuchObject } from 'xo-common/api-errors.js'

import Authentication from './authentication.mjs'

const INVALID_TOKEN_IDS = [
  {},
  [],
  null,
  undefined,
  0,
  1,
  true,
  false,
  '',
  { user_id: 'user-1' },
  { id: '' },
  { id: 42 },
  { id: null },
  { id: {} },
  { id: 'valid-token', user_id: '' },
  { id: 'valid-token', user_id: 42 },
  { id: 'valid-token', user_id: {} },
]

const format = value => (value === undefined ? 'undefined' : JSON.stringify(value))

const createAuthentication = ({ tokens = [], existingUsers = ['user-1'] } = {}) => {
  const calls = { first: [], remove: [], update: [] }
  const app = {
    config: {
      watch: (_key, callback) =>
        callback({ defaultTokenValidity: '1h', maxTokenValidity: '2h', throttlingDelay: '1s' }),
    },
    doesUserExist: async userId => existingUsers.includes(userId),
    emit() {},
    getUser: async userId => ({ id: userId }),
    hooks: { on() {} },
  }
  const authentication = new Authentication(app)
  authentication._tokens = {
    first: async predicate => {
      calls.first.push(predicate)
      return tokens.find(token => {
        if (predicate === null || typeof predicate !== 'object') {
          return token.id === predicate
        }
        return Object.entries(predicate).every(([key, value]) => token[key] === value)
      })
    },
    remove: async id => {
      calls.remove.push(id)
    },
    update: async token => {
      calls.update.push(token)
    },
  }
  app.getAuthenticationToken = authentication.getAuthenticationToken.bind(authentication)

  return { app, authentication, calls }
}

const createValidToken = () => ({ id: 'valid-token', expiration: Date.now() + 60_000, user_id: 'user-1' })

describe('Authentication token lookup', () => {
  for (const value of INVALID_TOKEN_IDS) {
    it(`rejects ${format(value)} without accessing the token collection`, async () => {
      const { authentication, calls } = createAuthentication({ tokens: [createValidToken()] })

      await assert.rejects(authentication.getAuthenticationToken(value), error =>
        noSuchObject.is(error, { type: 'authenticationToken' })
      )
      assert.equal(calls.first.length, 0)
      assert.equal(calls.update.length, 0)
    })

    it(`does not validate ${format(value)} as a web cookie token`, async () => {
      const { authentication, calls } = createAuthentication({ tokens: [createValidToken()] })

      assert.equal(await authentication.isValidAuthenticationToken(value), false)
      assert.equal(calls.first.length, 0)
      assert.equal(calls.update.length, 0)
    })
  }

  it('accepts a valid string token ID', async () => {
    const token = createValidToken()
    const { authentication, calls } = createAuthentication({ tokens: [token] })

    assert.equal(await authentication.getAuthenticationToken(token.id), token)
    assert.deepEqual(calls.first, [token.id])
  })

  it('preserves compound lookups by ID and user ID', async () => {
    const token = createValidToken()
    const { authentication, calls } = createAuthentication({ tokens: [token] })
    const predicate = { id: token.id, user_id: token.user_id }

    assert.equal(await authentication.getAuthenticationToken(predicate), token)
    assert.deepEqual(calls.first, [predicate])
  })

  it('does not forward extra caller-supplied keys to the token collection', async () => {
    const token = createValidToken()
    const { authentication, calls } = createAuthentication({ tokens: [token] })

    assert.equal(await authentication.getAuthenticationToken({ id: token.id, foo: 'bar' }), token)
    assert.deepEqual(calls.first, [token.id])
  })

  it('rejects and removes an expired token', async () => {
    const token = { ...createValidToken(), expiration: Date.now() - 1 }
    const { authentication, calls } = createAuthentication({ tokens: [token] })

    await assert.rejects(authentication.getAuthenticationToken(token.id), error => noSuchObject.is(error))
    assert.deepEqual(calls.remove, [token.id])
  })

  it('does not validate a token whose user no longer exists', async () => {
    const { authentication } = createAuthentication({ tokens: [createValidToken()], existingUsers: [] })

    assert.equal(await authentication.isValidAuthenticationToken('valid-token'), false)
  })
})

describe('Authentication token provider', () => {
  for (const value of [{}, [], '']) {
    it(`rejects ${format(value)} without reading or updating tokens`, async () => {
      const { app, authentication, calls } = createAuthentication({ tokens: [createValidToken()] })
      // spy so the provider guard is checked on its own, not through the lookup guard
      const lookups = []
      app.getAuthenticationToken = async id => {
        lookups.push(id)
      }

      await assert.rejects(
        authentication.authenticateUser({ token: value }, { ip: '192.0.2.1' }, { bypassTaskCreation: true }),
        error => invalidCredentials.is(error)
      )
      assert.equal(lookups.length, 0)
      assert.equal(calls.first.length, 0)
      assert.equal(calls.update.length, 0)
    })
  }

  it('authenticates the owner of a valid token and records its use', async () => {
    const token = createValidToken()
    const { authentication, calls } = createAuthentication({ tokens: [token] })

    const result = await authentication.authenticateUser(
      { token: token.id },
      { ip: '192.0.2.1' },
      { bypassTaskCreation: true }
    )

    assert.equal(result.user.id, token.user_id)
    assert.equal(result.bypassOtp, true)
    assert.equal(calls.update.length, 1)
    assert.equal(typeof token.last_uses['192.0.2.1'].timestamp, 'number')
  })
})
