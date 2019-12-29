import { Strategy } from 'passport-github'

// ===================================================================

export const configurationSchema = {
  type: 'object',
  properties: {
    clientID: {
      type: 'string',
    },
    clientSecret: {
      type: 'string',
    },
  },
  required: ['clientID', 'clientSecret'],
}

// ===================================================================

class AuthGitHubXoPlugin {
  constructor(xo) {
    this._unregisterPassportStrategy = undefined
    this._xo = xo
  }

  configure(conf) {
    this._conf = conf
  }

  load() {
    const { _xo: xo } = this

    this._unregisterPassportStrategy = xo.registerPassportStrategy(
      new Strategy(
        this._conf,
        async (accessToken, refreshToken, profile, done) => {
          try {
            done(null, await xo.registerUser('github', profile.username))
          } catch (error) {
            done(error.message)
          }
        }
      )
    )
  }

  unload() {
    this._unregisterPassportStrategy()
  }
}

// ===================================================================

export default ({ xo }) => new AuthGitHubXoPlugin(xo)
