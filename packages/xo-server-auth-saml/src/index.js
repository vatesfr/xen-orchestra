import {Strategy} from 'passport-saml'

// ===================================================================

function extract (obj, prop, defaultValue = undefined) {
  if (prop in obj) {
    const value = obj[prop]
    delete obj[prop]

    return value
  }

  return defaultValue
}

// ===================================================================

class AuthSamlXoPlugin {
  constructor (conf) {
    this._usernameField = extract(conf, 'usernameField', 'uid')
    this._conf = conf
  }

  load (xo) {
    xo.registerPassportStrategy(new Strategy(this._conf, async (profile, done) => {
      const name = profile[this._usernameField]
      if (!name) {
        done('no name found for this user')
        return
      }

      try {
        done(null, await xo.registerUser('saml', name))
      } catch (error) {
        done(error.message)
      }
    }))
  }
}

// ===================================================================

export default conf => new AuthSamlXoPlugin(conf)
