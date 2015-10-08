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

export const configurationSchema = {
  type: 'object',
  properties: {
    cert: {
      type: 'string'
    },
    entryPoint: {
      type: 'string'
    },
    issuer: {
      type: 'string'
    },
    usernameField: {
      type: 'string'
    }
  },
  required: ['cert', 'entryPoint', 'issuer']
}

// ===================================================================

class AuthSamlXoPlugin {
  constructor (xo) {
    this._xo = xo
  }

  configure (conf) {
    this._usernameField = extract(conf, 'usernameField', 'uid')
    this._conf = conf
  }

  load () {
    const {_xo: xo} = this

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

export default ({xo}) => new AuthSamlXoPlugin(xo)
