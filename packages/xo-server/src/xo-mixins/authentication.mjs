import { createLogger } from '@xen-orchestra/log'
import { createPredicate } from 'value-matcher'
import { ignoreErrors } from 'promise-toolbox'
import { invalidCredentials, noSuchObject } from 'xo-common/api-errors.js'
import { parseDuration } from '@vates/parse-duration'

import Token, { Tokens } from '../models/token.mjs'
import { forEach, generateToken } from '../utils.mjs'

// ===================================================================

const log = createLogger('xo:authentification')

const noSuchAuthenticationToken = id => noSuchObject(id, 'authenticationToken')

export default class {
  constructor(app) {
    app.config.watch('authentication', config => {
      this._defaultTokenValidity = parseDuration(config.defaultTokenValidity)
      this._maxTokenValidity = parseDuration(config.maxTokenValidity)
      this._throttlingDelay = parseDuration(config.throttlingDelay)
    })

    this._providers = new Set()
    this._app = app

    // Store last failures by user to throttle tries (slow bruteforce
    // attacks).
    this._failures = { __proto__: null }

    // Creates persistent collections.
    const tokensDb = (this._tokens = new Tokens({
      connection: app._redis,
      prefix: 'xo:token',
      indexes: ['user_id'],
    }))

    // Password authentication provider.
    this.registerAuthenticationProvider(async ({ username, password }, { ip } = {}) => {
      if (username === undefined || password === undefined) {
        return
      }

      const user = await app.getUserByName(username, true)
      if (user && (await app.checkUserPassword(user.id, password))) {
        return { userId: user.id }
      }

      app.emit('xo:audit', 'signInFailed', {
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
        const token = await app.getAuthenticationToken(tokenId)
        return { expiration: token.expiration, userId: token.user_id }
      } catch (error) {}
    })

    app.hooks.on('clean', async () => {
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

    app.hooks.on('start', () => {
      app.addConfigManager(
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
          user: await (userId !== undefined ? this._app.getUser(userId) : this._app.registerUser(undefined, username)),
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

  async authenticateUser(credentials, userData) {
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
    if (username && (lastFailure = failures[username]) && lastFailure + this._throttlingDelay > now) {
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

  async createAuthenticationToken({ expiresIn, userId }) {
    const token = new Token({
      id: await generateToken(),
      user_id: userId,
      expiration:
        Date.now() +
        Math.min(
          expiresIn !== undefined ? parseDuration(expiresIn) : this._defaultTokenValidity,
          this._maxTokenValidity
        ),
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
