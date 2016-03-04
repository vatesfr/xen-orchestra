import Token, { Tokens } from '../models/token'
import {
  NoSuchObject
} from '../api-errors'
import {
  createRawObject,
  generateToken,
  pCatch,
  noop
} from '../utils'

// ===================================================================

class NoSuchAuthenticationToken extends NoSuchObject {
  constructor (id) {
    super(id, 'authentication token')
  }
}

// ===================================================================

export default class {
  constructor (xo) {
    this._xo = xo

    // Store last failures by user to throttle tries (slow bruteforce
    // attacks).
    this._failures = createRawObject()

    this._providers = new Set()

    // Creates persistent collections.
    this._tokens = new Tokens({
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
      } catch (e) {
        return
      }
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
      expiration: Date.now() + 1e3 * 60 * 60 * 24 * 30 // 1 month validity.
    })

    await this._tokens.add(token)

    // TODO: use plain properties directly.
    return token.properties
  }

  async deleteAuthenticationToken (id) {
    if (!await this._tokens.remove(id)) { // eslint-disable-line space-before-keywords
      throw new NoSuchAuthenticationToken(id)
    }
  }

  async getAuthenticationToken (id) {
    let token = await this._tokens.first(id)
    if (!token) {
      throw new NoSuchAuthenticationToken(id)
    }

    token = token.properties

    if (!(
      token.expiration > Date.now()
    )) {
      this._tokens.remove(id)::pCatch(noop)

      throw new NoSuchAuthenticationToken(id)
    }

    return token
  }

  async _getAuthenticationTokensForUser (userId) {
    return this._tokens.get({ user_id: userId })
  }
}
