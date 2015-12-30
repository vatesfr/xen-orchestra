/* eslint no-throw-literal: 0 */

import eventToPromise from 'event-to-promise'
import { createClient } from 'ldapjs'
import { escape } from 'ldapjs/lib/filters/escape'
import { promisify } from 'bluebird'
import { readFile } from 'fs-promise'

// ===================================================================

const bind = (fn, thisArg) => function () {
  return fn.apply(thisArg, arguments)
}

const noop = () => {}

// -------------------------------------------------------------------

const VAR_RE = /\{\{([^}]+)\}\}/g
const evalFilter = (filter, vars) => filter.replace(VAR_RE, (_, name) => {
  const value = vars[name]

  if (value === undefined) {
    throw new Error('invalid variable: ' + name)
  }

  return escape(value)
})

export const configurationSchema = {
  type: 'object',
  properties: {
    uri: {
      description: 'URI of the LDAP server.',
      type: 'string'
    },
    certificateAuthorities: {
      description: `
Paths to CA certificates to use when connecting to SSL-secured LDAP servers.

If not specified, it will use a default set of well-known CAs.
`.trim(),
      type: 'array',
      items: {
        type: 'string'
      }
    },
    checkCertificate: {
      description: 'Check the validity of the server\'s certificates. Useful when connecting to servers that use a self-signed certificate.',
      type: 'boolean',
      default: true
    },
    bind: {
      description: 'Credentials to use before looking for the user record.',
      type: 'object',
      properties: {
        dn: {
          description: `
Distinguished name of the user permitted to search the LDAP directory for the user to authenticate.

For Microsoft Active Directory, it can also be \`<user>@<domain>\`.
`.trim(),
          type: 'string'
        },
        password: {
          description: 'Password of the user permitted of search the LDAP directory.',
          type: 'string'
        }
      },
      required: ['dn', 'password']
    },
    base: {
      description: 'The base is the part of the description tree where the users are looked for.',
      type: 'string'
    },
    filter: {
      description: `
Filter used to find the user.

For Microsoft Active Directory, you can try one of the following filters:

- \`(cn={{name}})\`
- \`(sAMAccountName={{name}})\`
- \`(sAMAccountName={{name}}@<domain>)\`
- \`(userPrincipalName={{name}})\`
`.trim(),
      type: 'string',
      default: '(uid={{name}})'
    }
  },
  required: ['uri', 'base']
}

// ===================================================================

class AuthLdap {
  constructor (xo) {
    this._xo = xo

    this._authenticate = bind(this._authenticate, this)
  }

  async configure (conf) {
    const clientOpts = this._clientOpts = {
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
        tlsOptions.ca = await Promise.all(
          certificateAuthorities.map(path => readFile(path))
        )
      }
    }

    const {
      bind: credentials,
      base: searchBase,
      filter: searchFilter = '(uid={{name}})'
    } = conf

    this._credentials = credentials
    this._searchBase = searchBase
    this._searchFilter = searchFilter
  }

  load () {
    this._xo.registerAuthenticationProvider(this._authenticate)
  }

  unload () {
    this._xo.unregisterAuthenticationProvider(this._authenticate)
  }

  async _authenticate ({ username, password }, logger = noop) {
    if (username === undefined || password === undefined) {
      logger('require `username` and `password` to authenticate!')

      return null
    }

    const client = createClient(this._clientOpts)

    try {
      // Promisify some methods.
      const bind = promisify(client.bind, client)
      const search = promisify(client.search, client)

      // Bind if necessary.
      {
        const {_credentials: credentials} = this
        if (credentials) {
          logger(`attempting to bind with as ${credentials.dn}...`)
          await bind(credentials.dn, credentials.password)
          logger(`successfully bound as ${credentials.dn}`)
        }
      }

      // Search for the user.
      const entries = []
      {
        logger('searching for entries...')
        const response = await search(this._searchBase, {
          scope: 'sub',
          filter: evalFilter(this._searchFilter, {
            name: username
          })
        })

        response.on('searchEntry', entry => {
          logger('.')
          entries.push(entry.json)
        })

        const {status} = await eventToPromise(response, 'end')
        if (status) {
          throw new Error('unexpected search response status: ' + status)
        }

        logger(`${entries.length} entries found`)
      }

      // Try to find an entry which can be bind with the given password.
      for (const entry of entries) {
        try {
          logger(`attempting to bind as ${entry.objectName}`)
          await bind(entry.objectName, password)
          logger(`successfully bound as ${entry.objectName} => ${username} authenticated`)
          return { username }
        } catch (_) {}
      }

      logger(`could not authenticate ${username}`)
      return null
    } finally {
      client.unbind()
    }
  }
}

// ===================================================================

export default ({xo}) => new AuthLdap(xo)
