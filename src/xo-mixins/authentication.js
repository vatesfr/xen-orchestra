import { noSuchObject } from 'xo-common/api-errors'
import { ignoreErrors } from 'promise-toolbox'

import Token, { Tokens } from '../models/token'
import {
  createRawObject,
  forEach,
  generateToken
} from '../utils'

// ===================================================================

const noSuchAuthenticationToken = id =>
  noSuchObject(id, 'authenticationToken')

const ONE_MONTH = 1e3 * 60 * 60 * 24 * 30

export default class {
  constructor (xo) {
    this._xo = xo

    // Store last failures by user to throttle tries (slow bruteforce
    // attacks).
    this._failures = createRawObject()

    this._providers = new Set()

    // Creates persistent collections.
    const tokensDb = this._tokens = new Tokens({
      connection: xo._redis,
      prefix: 'xo:token',
      indexes: ['user_id']
    })

    // Password authentication provider.
    this.registerAuthenticationProvider(async ({
      username,
      password
    }) => {
      if (username === undefined || password === undefined) {
        return
      }

      const user = await xo.getUserByName(username, true)
      if (user && await xo.checkUserPassword(user.id, password)) {
        return user.id
      }
    })

    // Token authentication provider.
    this.registerAuthenticationProvider(async ({
      token: tokenId
    }) => {
      if (!tokenId) {
        return
      }

      try {
        return (await xo.getAuthenticationToken(tokenId)).user_id
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
    })

    xo.on('start', () => {
      xo.addConfigManager('authTokens',
        () => tokensDb.get(),
        tokens => tokensDb.update(tokens)
      )
    })
  }

  registerAuthenticationProvider (provider) {
    return this._providers.add(provider)
  }

  unregisterAuthenticationProvider (provider) {
    return this._providers.delete(provider)
  }

  async _authenticateUser (credentials) {
    for (const provider of this._providers) {
      try {
        // A provider can return:
        // - `null` if the user could not be authenticated
        // - the identifier of the authenticated user
        // - an object with a property `username` containing the name
        //   of the authenticated user
        const result = await provider(credentials)

        // No match.
        if (!result) {
          continue
        }

        return result.username
          ? await this._xo.registerUser(undefined, result.username)
          : await this._xo.getUser(result)
      } catch (error) {
        // DEPRECATED: Authentication providers may just throw `null`
        // to indicate they could not authenticate the user without
        // any special errors.
        if (error) console.error(error.stack || error)
      }
    }

    return false
  }

  async authenticateUser (credentials) {
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
    if (
      username &&
      (lastFailure = failures[username]) &&
      (lastFailure + 2e3) > now
    ) {
      throw new Error('too fast authentication tries')
    }

    const user = await this._authenticateUser(credentials)
    if (user) {
      delete failures[username]
    } else {
      failures[username] = now
    }

    return user
  }

  // -----------------------------------------------------------------

  async createAuthenticationToken ({userId}) {
    const token = new Token({
      id: await generateToken(),
      user_id: userId,
      expiration: Date.now() + ONE_MONTH
    })

    await this._tokens.add(token)

    // TODO: use plain properties directly.
    return token.properties
  }

  async deleteAuthenticationToken (id) {
    if (!await this._tokens.remove(id)) {
      throw noSuchAuthenticationToken(id)
    }
  }

  async getAuthenticationToken (id) {
    let token = await this._tokens.first(id)
    if (!token) {
      throw noSuchAuthenticationToken(id)
    }

    token = token.properties

    if (!(
      token.expiration > Date.now()
    )) {
      this._tokens.remove(id)::ignoreErrors()

      throw noSuchAuthenticationToken(id)
    }

    return token
  }

  async getAuthenticationTokensForUser (userId) {
    return this._tokens.get({ user_id: userId })
  }
}
