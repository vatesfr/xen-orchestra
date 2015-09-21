/* eslint no-throw-literal: 0 */

import {promisify} from 'bluebird'
import eventToPromise from 'event-to-promise'
import {createClient} from 'ldapjs'
import {escape} from 'ldapjs/lib/filters/escape'
import {readFileSync} from 'fs'

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
      tlsOptions: {}
    }

    {
      const {
        bind,
        checkCertificate = true,
        certificateAuthorities
      } = conf

      if (bind) {
        clientOpts.bindDN = bind.dn
        clientOpts.bindCredentials = bind.password
      }

      const {tlsOptions} = clientOpts

      tlsOptions.rejectUnauthorized = checkCertificate
      if (certificateAuthorities) {
        // FIXME: should be async!!!
        tlsOptions.ca = certificateAuthorities.map(path => readFileSync(path))
      }
    }

    const {
      base: searchBase,
      filter: searchFilter = '(uid={{name}})'
    } = conf

    this._provider = async function ({username, password}) {
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
            await bind(credentials.dn, credentials.password)
          }
        }

        // Search for the user.
        const entries = []
        {
          const response = await search(searchBase, {
            scope: 'sub',
            filter: evalFilter(searchFilter, {
              name: username
            })
          })

          response.on('searchEntry', entry => {
            entries.push(entry.json)
          })

          const {status} = await eventToPromise(response, 'end')
          if (status) {
            throw new Error('unexpected search response status: ' + status)
          }
        }

        // Try to find an entry which can be bind with the given password.
        for (const entry of entries) {
          try {
            await bind(entry.objectName, password)
            return { username }
          } catch (_) {}
        }

        throw null
      } finally {
        client.unbind()
      }
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
