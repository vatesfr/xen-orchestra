/* eslint no-throw-literal: 0 */

import ensureArray from 'ensure-array'
import fromCallback from 'promise-toolbox/fromCallback'
import { Client } from 'ldapts'
import { createLogger } from '@xen-orchestra/log'
import { Filter } from 'ldapts/filters/Filter'
import { readFile } from 'fs'

const logger = createLogger('xo:xo-server-auth-ldap')

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

export const configurationSchema = {
  type: 'object',
  properties: {
    uri: {
      title: 'URI',
      description: 'URI of the LDAP server.',
      type: 'string',
    },
    certificateAuthorities: {
      title: 'Certificate Authorities',
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
      title: 'Check certificate',
      description:
        "Enforce the validity of the server's certificates. You can disable it when connecting to servers that use a self-signed certificate.",
      type: 'boolean',
      default: DEFAULTS.checkCertificate,
    },
    startTls: {
      title: 'Use StartTLS',
      type: 'boolean',
    },
    base: {
      title: 'Base',
      description: 'The base is the part of the description tree where the users and groups are looked for.',
      type: 'string',
    },
    bind: {
      title: 'Credentials',
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
          description: 'Password of the user permitted of search the LDAP directory.',
          type: 'string',
        },
      },
      required: ['dn', 'password'],
    },
    filter: {
      title: 'User filter',
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
    userIdAttribute: {
      title: 'ID attribute',
      description: 'Attribute used to map LDAP user to XO user. Must be unique. e.g.: `dn`',
      type: 'string',
    },
    groups: {
      title: 'Synchronize groups',
      description: 'Import groups from LDAP directory',
      type: 'object',
      properties: {
        base: {
          title: 'Base',
          description: 'Where to look for the groups.',
          type: 'string',
        },
        filter: {
          title: 'Filter',
          description: 'Filter used to find the groups. e.g.: `(objectClass=groupOfNames)`',
          type: 'string',
        },
        idAttribute: {
          title: 'ID attribute',
          description: 'Attribute used to map LDAP group to XO group. Must be unique. e.g.: `gid`',
          type: 'string',
        },
        displayNameAttribute: {
          title: 'Display name attribute',
          description: "Attribute used to determine the group's name in XO. e.g.: `cn`",
          type: 'string',
        },
        membersMapping: {
          title: 'Members mapping',
          type: 'object',
          properties: {
            groupAttribute: {
              title: 'Group attribute',
              description:
                'Attribute used to find the members of a group. e.g.: `memberUid`. The values must reference the user IDs (cf. user ID attribute)',
              type: 'string',
            },
            userAttribute: {
              title: 'User attribute',
              description: 'User attribute used to match group members to the users. e.g.: `uidNumber`',
              type: 'string',
            },
          },
          required: ['groupAttribute', 'userAttribute'],
        },
      },
      required: ['base', 'filter', 'idAttribute', 'displayNameAttribute', 'membersMapping'],
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
  constructor({ xo } = {}) {
    this._xo = xo

    this._authenticate = this._authenticate.bind(this)
  }

  async configure(conf) {
    const clientOpts = (this._clientOpts = {
      url: conf.uri,
      maxConnections: 5,
    })

    {
      const { checkCertificate = DEFAULTS.checkCertificate, certificateAuthorities } = conf

      const tlsOptions = (this._tlsOptions = {})

      tlsOptions.rejectUnauthorized = checkCertificate
      if (certificateAuthorities) {
        tlsOptions.ca = await Promise.all(certificateAuthorities.map(path => fromCallback(readFile, path)))
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
      groups,
      uri,
      userIdAttribute,
    } = conf

    this._credentials = credentials
    this._serverUri = uri
    this._searchBase = searchBase
    this._searchFilter = searchFilter
    this._startTls = startTls
    this._groupsConfig = groups
    this._userIdAttribute = userIdAttribute
  }

  load() {
    this._xo.registerAuthenticationProvider(this._authenticate)
    this._removeApiMethods = this._xo.addApiMethods({
      ldap: {
        synchronizeGroups: () => this._synchronizeGroups(),
      },
    })
  }

  unload() {
    this._xo.unregisterAuthenticationProvider(this._authenticate)
    this._removeApiMethods()
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
    if (username === undefined || password === undefined) {
      logger.debug('require `username` and `password` to authenticate!')

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
          logger.debug(`attempting to bind with as ${credentials.dn}...`)
          await client.bind(credentials.dn, credentials.password)
          logger.debug(`successfully bound as ${credentials.dn}`)
        }
      }

      // Search for the user.
      logger.debug('searching for entries...')
      const { searchEntries: entries } = await client.search(this._searchBase, {
        scope: 'sub',
        filter: evalFilter(this._searchFilter, {
          name: username,
        }),
      })
      logger.debug(`${entries.length} entries found`)

      // Try to find an entry which can be bind with the given password.
      for (const entry of entries) {
        try {
          logger.debug(`attempting to bind as ${entry.dn}`)
          await client.bind(entry.dn, password)
          logger.info(`successfully bound as ${entry.dn} => ${username} authenticated`)
          logger.debug(JSON.stringify(entry, null, 2))

          // CLI test: don't register user/sync groups
          if (this._xo === undefined) {
            return
          }

          let user
          if (this._userIdAttribute === undefined) {
            // Support legacy config
            user = await this._xo.registerUser(undefined, username)
          } else {
            const ldapId = entry[this._userIdAttribute]
            user = await this._xo.registerUser2('ldap', {
              user: { id: ldapId, name: username },
            })

            const groupsConfig = this._groupsConfig
            if (groupsConfig !== undefined) {
              try {
                await this._synchronizeGroups(user, entry[groupsConfig.membersMapping.userAttribute])
              } catch (error) {
                logger.error(`failed to synchronize groups: ${error.message}`)
              }
            }
          }

          return { userId: user.id }
        } catch (error) {
          logger.debug(`failed to bind as ${entry.dn}: ${error.message}`)
        }
      }

      logger.debug(`could not authenticate ${username}`)
      return null
    } finally {
      await client.unbind()
    }
  }

  // Synchronize user's groups OR all groups if no user is passed
  async _synchronizeGroups(user, memberId) {
    const client = new Client(this._clientOpts)

    try {
      if (this._startTls) {
        await client.startTLS(this._tlsOptions)
      }

      // Bind if necessary.
      {
        const { _credentials: credentials } = this
        if (credentials) {
          logger.debug(`attempting to bind with as ${credentials.dn}...`)
          await client.bind(credentials.dn, credentials.password)
          logger.debug(`successfully bound as ${credentials.dn}`)
        }
      }
      logger.info('syncing groups...')
      const { base, displayNameAttribute, filter, idAttribute, membersMapping } = this._groupsConfig
      const { searchEntries: ldapGroups } = await client.search(base, {
        scope: 'sub',
        filter: filter || '', // may be undefined
      })

      const xoUsers =
        user === undefined &&
        (await this._xo.getAllUsers()).filter(user => user.authProviders !== undefined && 'ldap' in user.authProviders)
      const xoGroups = await this._xo.getAllGroups()

      // For each LDAP group:
      // - create/update/delete the corresponding XO group
      // - add/remove the LDAP-provided users
      // One by one to avoid race conditions
      for (const ldapGroup of ldapGroups) {
        const groupLdapId = ldapGroup[idAttribute]
        const groupLdapName = ldapGroup[displayNameAttribute]

        // Empty or undefined names/IDs are invalid
        if (!groupLdapId || !groupLdapName) {
          logger.error(`Invalid group ID (${groupLdapId}) or name (${groupLdapName})`)
          continue
        }

        const ldapGroupMembers = ensureArray(ldapGroup[membersMapping.groupAttribute])

        // If a user was passed, only update the user's groups
        if (user !== undefined && !ldapGroupMembers.includes(memberId)) {
          continue
        }

        let xoGroup
        const xoGroupIndex = xoGroups.findIndex(
          group => group.provider === 'ldap' && group.providerGroupId === groupLdapId
        )

        if (xoGroupIndex === -1) {
          if (xoGroups.find(group => group.name === groupLdapName) !== undefined) {
            // TODO: check against LDAP groups that are being created as well
            logger.error(`A group called ${groupLdapName} already exists`)
            continue
          }
          xoGroup = await this._xo.createGroup({
            name: groupLdapName,
            provider: 'ldap',
            providerGroupId: groupLdapId,
          })
        } else {
          // Remove it from xoGroups as we will then delete all the remaining
          // LDAP-provided groups
          ;[xoGroup] = xoGroups.splice(xoGroupIndex, 1)
          await this._xo.updateGroup(xoGroup.id, { name: groupLdapName })
          xoGroup = await this._xo.getGroup(xoGroup.id)
        }

        // If a user was passed, only add that user to the group and don't
        // delete any groups (ie return immediately)
        if (user !== undefined) {
          await this._xo.addUserToGroup(user.id, xoGroup.id)
          continue
        }

        const xoGroupMembers = xoGroup.users === undefined ? [] : xoGroup.users.slice(0)

        for (const memberId of ldapGroupMembers) {
          const {
            searchEntries: [ldapUser],
          } = await client.search(this._searchBase, {
            scope: 'sub',
            filter: `(${escape(membersMapping.userAttribute)}=${escape(memberId)})`,
            sizeLimit: 1,
          })
          if (ldapUser === undefined) {
            continue
          }

          const xoUser = xoUsers.find(user => user.authProviders.ldap.id === ldapUser[this._userIdAttribute])
          if (xoUser === undefined) {
            continue
          }
          // If the user exists in XO, should be a member of the LDAP-provided
          // group but isn't: add it
          const userIdIndex = xoGroupMembers.findIndex(id => id === xoUser.id)
          if (userIdIndex !== -1) {
            xoGroupMembers.splice(userIdIndex, 1)
            continue
          }

          await this._xo.addUserToGroup(xoUser.id, xoGroup.id)
        }

        // All the remaining users of that group can be removed from it since
        // they're not in the LDAP group
        for (const userId of xoGroupMembers) {
          await this._xo.removeUserFromGroup(userId, xoGroup.id)
        }
      }

      if (user === undefined) {
        // All the remaining groups provided by LDAP can be removed from XO since
        // they don't exist in the LDAP directory any more
        await Promise.all(
          xoGroups.filter(group => group.provider === 'ldap').map(group => this._xo.deleteGroup(group.id))
        )
      }

      logger.info('done syncing groups')
    } finally {
      await client.unbind()
    }
  }
}

// ===================================================================

export default opts => new AuthLdap(opts)
