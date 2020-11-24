import createLogger from '@xen-orchestra/log'
import { createPredicate } from 'value-matcher'
import { ignoreErrors } from 'promise-toolbox'
import { invalidCredentials, noSuchObject } from 'xo-common/api-errors'
import { parseDuration } from '@vates/parse-duration'

import Token, { Tokens } from '../models/token'
import { forEach, generateToken } from '../utils'

// ===================================================================

const log = createLogger('xo:authentification')

const noSuchAuthenticationToken = id => noSuchObject(id, 'authenticationToken')

export default class {
  constructor(xo, config) {
    this._config = config.authentication
    this._providers = new Set()
    this._xo = xo

    // Store last failures by user to throttle tries (slow bruteforce
    // attacks).
    this._failures = { __proto__: null }

    // Creates persistent collections.
    const tokensDb = (this._tokens = new Tokens({
      connection: xo._redis,
      prefix: 'xo:token',
      indexes: ['user_id'],
    }))

    // Password authentication provider.
    this.registerAuthenticationProvider(async ({ username, password }, { ip } = {}) => {
      if (username === undefined || password === undefined) {
        return
      }

      const user = await xo.getUserByName(username, true)
      if (user && (await xo.checkUserPassword(user.id, password))) {
        return { userId: user.id }
      }

      xo.emit('xo:audit', 'signInFailed', {
        userId: user?.id,
        userName: username,
        userIp: ip,
      })
    })

    // Token authentication provider.
    this.registerAuthenticationProvider(async ({ token: tokenId }) => {
      if (!tokenId) {
        return
      }

      try {
        const token = await xo.getAuthenticationToken(tokenId)
        return { expiration: token.expiration, userId: token.user_id }
      } catch (error) {}
    })

    xo.on('clean', async () => {
      const tokens = await tokensDb.get()
      const toRemove = []
      const now = Date.now()
      forEach(tokens, ({ expiration, id }) => {
        if (!expiration || expiration < now) {
          toRemove.push(id)
        }
      })
      await tokensDb.remove(toRemove)
      return tokensDb.rebuildIndexes()
    })

    xo.on('start', () => {
      xo.addConfigManager(
        'authTokens',
        () => tokensDb.get(),
        tokens => tokensDb.update(tokens)
      )
    })
  }

  registerAuthenticationProvider(provider) {
    return this._providers.add(provider)
  }

  unregisterAuthenticationProvider(provider) {
    return this._providers.delete(provider)
  }

  async _authenticateUser(credentials, userData) {
    for (const provider of this._providers) {
      try {
        // A provider can return:
        // - `undefined`/`null` if the user could not be authenticated
        // - an object containing:
        //   - `userId`
        //   - optionally `expiration` to indicate when the session is no longer
        //     valid
        // - an object with a property `username` containing the name
        //   of the authenticated user
        const result = await provider(credentials, userData)

        // No match.
        if (result == null) {
          continue
        }

        const { userId, username, expiration } = result

        return {
          user: await (userId !== undefined ? this._xo.getUser(userId) : this._xo.registerUser(undefined, username)),
          expiration,
        }
      } catch (error) {
        // DEPRECATED: Authentication providers may just throw `null`
        // to indicate they could not authenticate the user without
        // any special errors.
        if (error !== null) log.error(error)
      }
    }
  }

  async authenticateUser(credentials, userData): Promise<{| user: Object, expiration?: number |}> {
    // don't even attempt to authenticate with empty password
    const { password } = credentials
    if (password === '') {
      throw new Error('empty password')
    }

    // TODO: remove when email has been replaced by username.
    if (credentials.email) {
      credentials.username = credentials.email
    } else if (credentials.username) {
      credentials.email = credentials.username
    }

    const failures = this._failures

    const { username } = credentials
    const now = Date.now()
    let lastFailure
    if (username && (lastFailure = failures[username]) && lastFailure + 2e3 > now) {
      throw new Error('too fast authentication tries')
    }

    const result = await this._authenticateUser(credentials, userData)
    if (result === undefined) {
      failures[username] = now
      throw invalidCredentials()
    }

    delete failures[username]
    return result
  }

  // -----------------------------------------------------------------

  async createAuthenticationToken({ expiresIn = this._config.defaultTokenValidity, userId }) {
    const token = new Token({
      id: await generateToken(),
      user_id: userId,
      expiration: Date.now() + Math.min(parseDuration(expiresIn), parseDuration(this._config.maxTokenValidity)),
    })

    await this._tokens.add(token)

    // TODO: use plain properties directly.
    return token.properties
  }

  async deleteAuthenticationToken(id) {
    if (!(await this._tokens.remove(id))) {
      throw noSuchAuthenticationToken(id)
    }
  }

  async deleteAuthenticationTokens({ filter }) {
    return Promise.all(
      (await this._tokens.get()).filter(createPredicate(filter)).map(({ id }) => this.deleteAuthenticationToken(id))
    )
  }

  async getAuthenticationToken(id) {
    let token = await this._tokens.first(id)
    if (token === undefined) {
      throw noSuchAuthenticationToken(id)
    }

    token = token.properties

    if (!(token.expiration > Date.now())) {
      this._tokens.remove(id)::ignoreErrors()

      throw noSuchAuthenticationToken(id)
    }

    return token
  }

  async getAuthenticationTokensForUser(userId) {
    return this._tokens.get({ user_id: userId })
  }
}
