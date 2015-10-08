import {OAuth2Strategy as Strategy} from 'passport-google-oauth'

// ===================================================================

export const configurationSchema = {
  type: 'object',
  properties: {
    callbackURL: {
      type: 'string',
      description: 'Must be exactly the same as specified on the Google developer console.'
    },
    clientID: {
      type: 'string'
    },
    clientSecret: {
      type: 'string'
    }
  },
  required: ['callbackURL', 'clientID', 'clientSecret']
}

// ===================================================================

class AuthGoogleXoPlugin {
  constructor (xo) {
    this._xo = xo
  }

  configure (conf) {
    conf.scope = 'https://www.googleapis.com/auth/plus.login'

    this._conf = conf
  }

  load () {
    const {_xo: xo} = this

    xo.registerPassportStrategy(new Strategy(this._conf, async (accessToken, refreshToken, profile, done) => {
      try {
        console.log(profile)
        done(null, await xo.registerUser('google', profile.displayName))
      } catch (error) {
        done(error.message)
      }
    }))
  }
}

// ===================================================================

export default ({xo}) => new AuthGoogleXoPlugin(xo)
