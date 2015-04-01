import Bluebird from 'bluebird'
import {createClient} from 'ldapjs'
import {escape} from 'ldapjs/lib/filters/escape'

// ===================================================================

class AuthLdap {
  constructor (conf) {
    const base = conf.base ? ',' + conf.base : ''
    const clientOpts = {
      url: conf.uri
    }

    this._provider = (credentials) => {
      const {username, password} = credentials
      if (username === undefined || password === undefined) {
        return Bluebird.reject(new Error('invalid credentials'))
      }

      return new Bluebird((resolve, reject) => {
        const client = createClient(clientOpts)

        client.bind(
          'uid=' + escape(username) + base,
          password,
          (error) => {
            if (error) {
              reject(error)
            } else {
              resolve({ username })
            }

            client.unbind()
          }
        )
      })
    }
  }

  load (xo) {
    xo.registerAuthenticationProvider(this._provider)
  }

  unload (xo) {
    xo.unregisterAuthenticationProvider(this._provider)
  }
}

// ===================================================================

export default (conf) => new AuthLdap(conf)
