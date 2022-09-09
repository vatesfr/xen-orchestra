import { createLogger } from '@xen-orchestra/log'
import { createPredicate } from 'value-matcher'
import { ignoreErrors } from 'promise-toolbox'
import { invalidCredentials, noSuchObject } from 'xo-common/api-errors.js'
import { parseDuration } from '@vates/parse-duration'

import patch from '../patch.mjs'
import { Tokens } from '../models/token.mjs'
import { forEach, generateToken } from '../utils.mjs'

// ===================================================================

const log = createLogger('xo:authentification')

const noSuchAuthenticationToken = id => noSuchObject(id, 'authenticationToken')

const unserialize = token => {
  if (token.created_at !== undefined) {
    token.created_at = +token.created_at
  }
  token.expiration = +token.expiration
}

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
      namespace: 'token',
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

  async createAuthenticationToken({ description, expiresIn, userId }) {
    let duration = this._defaultTokenValidity
    if (expiresIn !== undefined) {
      duration = parseDuration(expiresIn)
      if (duration <= 60e3) {
        throw new Error('invalid expiresIn duration: ' + expiresIn)
      } else if (duration > this._maxTokenValidity) {
        throw new Error('too high expiresIn duration: ' + expiresIn)
      }
    }

    const now = Date.now()
    const token = {
      created_at: now,
      description,
      id: await generateToken(),
      user_id: userId,
      expiration: now + duration,
    }

    await this._tokens.add(token)

    return token
  }

  async deleteAuthenticationToken(id) {
    let predicate
    const { apiContext } = this._app
    if (apiContext === undefined || apiContext.permission === 'admin') {
      predicate = id
    } else {
      predicate = { id, user_id: apiContext.user.id }
    }

    if (!(await this._tokens.remove(predicate))) {
      throw noSuchAuthenticationToken(id)
    }
  }

  async deleteAuthenticationTokens({ filter }) {
    let predicate
    const { apiContext } = this._app
    if (apiContext !== undefined && apiContext.permission !== 'admin') {
      predicate = { user_id: apiContext.user.id }
    }

    const db = this._tokens
    return db.remove((await db.get(predicate)).filter(createPredicate(filter)).map(({ id }) => id))
  }

  async _getAuthenticationToken(id, properties) {
    const token = await this._tokens.first(properties ?? id)
    if (token !== undefined) {
      unserialize(token)

      if (token.expiration > Date.now()) {
        return token
      }

      this._tokens.remove(id)::ignoreErrors()
    }
  }

  async getAuthenticationToken(properties) {
    const id = typeof properties === 'string' ? properties : properties.id

    const token = await this._getAuthenticationToken(id, properties)
    if (token === undefined) {
      throw noSuchAuthenticationToken(id)
    }
    return token
  }

  async getAuthenticationTokensForUser(userId) {
    const tokens = []

    const now = Date.now()
    const tokensDb = this._tokens
    const toRemove = []
    for (const token of await tokensDb.get({ user_id: userId })) {
      unserialize(token)

      const { expiration } = token
      if (expiration < now) {
        toRemove.push(token.id)
      } else {
        tokens.push(token)
      }
    }
    tokensDb.remove(toRemove).catch(log.warn)

    return tokens
  }

  async isValidAuthenticationToken(id) {
    return (await this._getAuthenticationToken(id)) !== undefined
  }

  async updateAuthenticationToken(properties, { description }) {
    const token = await this.getAuthenticationToken(properties)
    patch(token, { description })
    await this._tokens.update(token)
    return token
  }
}
