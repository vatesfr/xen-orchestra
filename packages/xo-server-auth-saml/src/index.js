import {Strategy} from 'passport-saml'

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
  constructor ({ xo }) {
    this._conf = null
    this._usernameField = null
    this._xo = xo
  }

  configure ({ usernameField, ...conf }) {
    this._usernameField = usernameField
    this._conf = conf
  }

  load () {
    const xo = this._xo

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

export default opts => new AuthSamlXoPlugin(opts)
