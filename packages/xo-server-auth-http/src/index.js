import { BasicStrategy } from 'passport-http'

export const configurationSchema = {
  type: 'object',
  properties: {
    realm: {
      type: 'string',
    },
  },
  required: ['realm'],
}

class Plugin {
  constructor({ xo }) {
    this._configuration = undefined
    this._unregisterPassportStrategy = undefined
    this._xo = xo
  }

  configure(configuration) {
    this._configuration = configuration
  }

  load() {
    const xo = this._xo
    this._unregisterPassportStrategy = xo.registerPassportStrategy(
      new BasicStrategy(
        this._configuration,
        async (username, password, done) => {
          try {
            const { user } = await xo.authenticateUser({ username, password })
            done(null, user)
          } catch (error) {
            done(null, false, { message: error.message })
          }
        }
      )
    )
  }

  unload() {
    this._unregisterPassportStrategy()
  }
}

export default opts => new Plugin(opts)
