/* eslint no-lone-blocks: 0, no-throw-literal: 0 */

import Bluebird, {coroutine, promisify} from 'bluebird'
import eventToPromise from 'event-to-promise'
import {createClient} from 'ldapjs'
import {escape} from 'ldapjs/lib/filters/escape'

// ===================================================================

const VAR_RE = /\{\{([^}]+)\}\}/g
function evalFilter (filter, vars) {
  return filter.replace(VAR_RE, (_, name) => {
    const value = vars[name]

    if (value === undefined) {
      throw new Error('invalid variable: ' + name)
    }

    return escape(value)
  })
}

// ===================================================================

class AuthLdap {
  constructor (conf) {
    const clientOpts = {
      url: conf.uri,
      maxConnections: 5,
      tlsOptions: { }
    }

    {
      const {bind} = conf
      if (bind) {
        clientOpts.bindDN = bind.dn
        clientOpts.bindCredentials = bind.password
      }
    }

    if (conf.check_certificate !== undefined) {
      clientOpts.tlsOptions.rejectUnauthorized = conf.check_certificate
    }

    const {base: searchBase} = conf
    const searchFilter = conf.filter || '(uid={{name}})'

    this._provider = coroutine(function * ({username, password}) {
      if (username === undefined || password === undefined) {
        throw null
      }

      const client = createClient(clientOpts)

      try {
        // Promisify some methods.
        const bind = promisify(client.bind, client)
        const search = promisify(client.search, client)

        // Bind if necessary.
        {
          const {bind: credentials} = conf
          if (credentials) {
            yield bind(credentials.dn, credentials.password)
          }
        }

        // Search for the user.
        const entries = []
        {
          const response = yield search(searchBase, {
            scope: 'sub',
            filter: evalFilter(searchFilter, {
              name: username
            })
          })

          response.on('searchEntry', entry => {
            entries.push(entry.json)
          })

          const {status} = yield eventToPromise(response, 'end')
          if (status) {
            throw new Error('unexpected search response status: ' + status)
          }
        }

        // Try to find an entry which can be bind with the given password.
        for (let entry of entries) {
          try {
            yield bind(entry.objectName, password)
            return { username }
          } catch (error) {}
        }

        throw null
      } finally {
        client.unbind()
      }
    })
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
