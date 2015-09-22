import {OAuth2Strategy as Strategy} from 'passport-google-oauth'

// ===================================================================

class AuthGoogleXoPlugin {
  constructor (conf) {
    conf.scope = 'https://www.googleapis.com/auth/plus.login'

    this._conf = conf
  }

  load (xo) {
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

export default conf => new AuthGoogleXoPlugin(conf)
