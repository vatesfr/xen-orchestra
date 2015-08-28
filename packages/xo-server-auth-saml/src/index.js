/* eslint no-throw-literal: 0 */

import {Strategy} from 'passport-saml'

// ===================================================================

class AuthSamlXoPlugin {
  constructor (conf) {
    this._conf = conf
  }

  load (xo) {
    xo.registerPassportStrategy(new Strategy(this._conf, async (profile, done) => {
      try {
        done(null, await xo.registerUser('saml', profile.uid))
      } catch (error) {
        done(error.message)
      }
    }))
  }
}

// ===================================================================

export default conf => new AuthSamlXoPlugin(conf)
