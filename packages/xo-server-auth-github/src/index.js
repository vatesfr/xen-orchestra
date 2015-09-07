import {Strategy} from 'passport-github'

// ===================================================================

class AuthGitHubXoPlugin {
  constructor (conf) {
    this._conf = conf
  }

  load (xo) {
    xo.registerPassportStrategy(new Strategy(this._conf, async (accessToken, refreshToken, profile, done) => {
      try {
        done(null, await xo.registerUser('github', profile.username))
      } catch (error) {
        done(error.message)
      }
    }))
  }
}

// ===================================================================

export default conf => new AuthGitHubXoPlugin(conf)
