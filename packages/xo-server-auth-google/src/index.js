import { Strategy } from 'passport-google-oauth20'

// ===================================================================

export const configurationSchema = {
  type: 'object',
  properties: {
    callbackURL: {
      type: 'string',
      description: 'Must be exactly the same as specified on the Google developer console.',
    },
    clientID: {
      type: 'string',
    },
    clientSecret: {
      type: 'string',
    },
    scope: {
      default: 'https://www.googleapis.com/auth/plus.login',
      description: 'Note that changing this value will break existing users.',
      enum: ['https://www.googleapis.com/auth/plus.login', 'email'],
      enumNames: ['Google+ name', 'Simple email address'],
    },
  },
  required: ['callbackURL', 'clientID', 'clientSecret'],
}

// ===================================================================

class AuthGoogleXoPlugin {
  constructor({ xo }) {
    this._conf = null
    this._unregisterPassportStrategy = undefined
    this._xo = xo
  }

  async configure(conf, { loaded }) {
    this._conf = conf

    if (loaded) {
      await this.unload()
      await this.load()
    }
  }

  load() {
    const conf = this._conf
    const xo = this._xo

    this._unregisterPassportStrategy = xo.registerPassportStrategy(
      new Strategy(conf, async (accessToken, refreshToken, profile, done) => {
        try {
          done(
            null,
            await xo.registerUser('google', conf.scope === 'email' ? profile.emails[0].value : profile.displayName)
          )
        } catch (error) {
          done(error.message)
        }
      })
    )
  }

  unload() {
    this._unregisterPassportStrategy()
  }
}

// ===================================================================

export default opts => new AuthGoogleXoPlugin(opts)
