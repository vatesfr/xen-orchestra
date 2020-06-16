/* eslint no-throw-literal: 0 */

import fromCallback from 'promise-toolbox/fromCallback'
import { Client } from 'ldapts'
import { Filter } from 'ldapts/filters/Filter'
import { readFile } from 'fs'

// ===================================================================

const DEFAULTS = {
  checkCertificate: true,
  filter: '(uid={{name}})',
}

const { escape } = Filter.prototype

const VAR_RE = /\{\{([^}]+)\}\}/g
const evalFilter = (filter, vars) =>
  filter.replace(VAR_RE, (_, name) => {
    const value = vars[name]

    if (value === undefined) {
      throw new Error('invalid variable: ' + name)
    }

    return escape(value)
  })

const noop = Function.prototype

export const configurationSchema = {
  type: 'object',
  properties: {
    uri: {
      description: 'URI of the LDAP server.',
      type: 'string',
    },
    certificateAuthorities: {
      description: `
Paths to CA certificates to use when connecting to SSL-secured LDAP servers.

If not specified, it will use a default set of well-known CAs.
`.trim(),
      type: 'array',
      items: {
        type: 'string',
      },
    },
    checkCertificate: {
      description:
        "Enforce the validity of the server's certificates. You can disable it when connecting to servers that use a self-signed certificate.",
      type: 'boolean',
      defaults: DEFAULTS.checkCertificate,
    },
    bind: {
      description: 'Credentials to use before looking for the user record.',
      type: 'object',
      properties: {
        dn: {
          description: `
Full distinguished name of the user permitted to search the LDAP directory for the user to authenticate.

Example: uid=xoa-auth,ou=people,dc=company,dc=net

For Microsoft Active Directory, it can also be \`<user>@<domain>\`.
`.trim(),
          type: 'string',
        },
        password: {
          description:
            'Password of the user permitted of search the LDAP directory.',
          type: 'string',
        },
      },
      required: ['dn', 'password'],
    },
    base: {
      description:
        'The base is the part of the description tree where the users are looked for.',
      type: 'string',
    },
    filter: {
      description: `
Filter used to find the user.

For LDAP if you want to filter for a special group you can try
something like:

- \`(&(uid={{name}})(memberOf=<group DN>))\`

For Microsoft Active Directory, you can try one of the following filters:

- \`(cn={{name}})\`
- \`(sAMAccountName={{name}})\`
- \`(sAMAccountName={{name}}@<domain>)\` (replace \`<domain>\` by your own domain)
- \`(userPrincipalName={{name}})\`

Or something like this if you also want to filter by group:

- \`(&(sAMAccountName={{name}})(memberOf=<group DN>))\`
`.trim(),
      type: 'string',
      default: DEFAULTS.filter,
    },
    startTls: {
      title: 'Use StartTLS',
      type: 'boolean',
    },
  },
  required: ['uri', 'base'],
}

export const testSchema = {
  type: 'object',
  properties: {
    username: {
      description: 'LDAP username',
      type: 'string',
    },
    password: {
      description: 'LDAP password',
      type: 'string',
    },
  },
  required: ['username', 'password'],
}

// ===================================================================

class AuthLdap {
  constructor({ logger = noop, xo }) {
    this._logger = logger
    this._xo = xo

    this._authenticate = this._authenticate.bind(this)
  }

  async configure(conf) {
    const clientOpts = (this._clientOpts = {
      url: conf.uri,
      maxConnections: 5,
    })

    {
      const {
        checkCertificate = DEFAULTS.checkCertificate,
        certificateAuthorities,
      } = conf

      const tlsOptions = (this._tlsOptions = {})

      tlsOptions.rejectUnauthorized = checkCertificate
      if (certificateAuthorities) {
        tlsOptions.ca = await Promise.all(
          certificateAuthorities.map(path => fromCallback(readFile, path))
        )
      }

      if (clientOpts.url.startsWith('ldaps:')) {
        clientOpts.tlsOptions = tlsOptions
      }
    }

    const {
      bind: credentials,
      base: searchBase,
      filter: searchFilter = DEFAULTS.filter,
      startTls = false,
    } = conf

    this._credentials = credentials
    this._searchBase = searchBase
    this._searchFilter = searchFilter
    this._startTls = startTls
  }

  load() {
    this._xo.registerAuthenticationProvider(this._authenticate)
  }

  unload() {
    this._xo.unregisterAuthenticationProvider(this._authenticate)
  }

  test({ username, password }) {
    return this._authenticate({
      username,
      password,
    }).then(result => {
      if (result === null) {
        throw new Error('could not authenticate user')
      }
    })
  }

  async _authenticate({ username, password }) {
    const logger = this._logger

    if (username === undefined || password === undefined) {
      logger('require `username` and `password` to authenticate!')

      return null
    }

    const client = new Client(this._clientOpts)

    try {
      if (this._startTls) {
        await client.startTLS(this._tlsOptions)
      }

      // Bind if necessary.
      {
        const { _credentials: credentials } = this
        if (credentials) {
          logger(`attempting to bind with as ${credentials.dn}...`)
          await client.bind(credentials.dn, credentials.password)
          logger(`successfully bound as ${credentials.dn}`)
        }
      }

      // Search for the user.
      logger('searching for entries...')
      const { searchEntries: entries } = await client.search(this._searchBase, {
        scope: 'sub',
        filter: evalFilter(this._searchFilter, {
          name: username,
        }),
      })
      logger(`${entries.length} entries found`)

      // Try to find an entry which can be bind with the given password.
      for (const entry of entries) {
        try {
          logger(`attempting to bind as ${entry.dn}`)
          await client.bind(entry.dn, password)
          logger(
            `successfully bound as ${entry.dn} => ${username} authenticated`
          )
          logger(JSON.stringify(entry, null, 2))
          return { username }
        } catch (error) {
          logger(`failed to bind as ${entry.dn}: ${error.message}`)
        }
      }

      logger(`could not authenticate ${username}`)
      return null
    } finally {
      await client.unbind()
    }
  }
}

// ===================================================================

export default opts => new AuthLdap(opts)
