/* eslint no-throw-literal: 0 */

import fromCallback from 'promise-toolbox/fromCallback'
import { Client } from 'ldapts'
import { Filter } from 'ldapts/filters/Filter'
import { URL } from 'url'
import { readFile } from 'fs'

// ===================================================================

const DEFAULTS = {
  checkCertificate: true,
  filter: '(uid={{name}})',
  users: {
    merge: false,
  },
  groups: {
    synchronize: false,
  },
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
      defaults: DEFAULTS.checkCertificate,
    },
    startTls: {
      title: 'Use StartTLS',
      type: 'boolean',
    },
    base: {
      title: 'Base',
      description:
        'The base is the part of the description tree where the users and groups are looked for.',
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
          description:
            'Password of the user permitted of search the LDAP directory.',
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
    users: {
      title: 'Users',
      description: 'Configure how LDAP users are added to XO',
      type: 'object',
      properties: {
        idAttribute: {
          title: 'ID attribute',
          description:
            'Attribute used to identify a user. Must be unique. e.g.: `uid`',
          type: 'string',
        },
        merge: {
          title: 'Merge users',
          description:
            'If a LDAP user has the same username as a XO user, it will be considered as the same user.',
          type: 'boolean',
        },
      },
    },
    groups: {
      title: 'Synchronize groups',
      description: 'Import groups from LDAP directory',
      type: 'object',
      properties: {
        synchronize: {
          title: 'Enable',
          description:
            "Import (or update) LDAP groups automatically every time a user logs into XO. If you don't enable this, you can still synchronize the LDAP groups manually from the Settings > Groups page.",
          type: 'boolean',
        },
        base: {
          title: 'Base',
          description: 'Where to look for the groups.',
          type: 'string',
        },
        filter: {
          title: 'Filter',
          description:
            'Filter used to find the groups. e.g.: `(objectClass=groupOfNames)`',
          type: 'string',
        },
        idAttribute: {
          title: 'ID attribute',
          description:
            'Attribute used to identify a group. Must be unique. e.g.: `gid`',
          type: 'string',
        },
        displayNameAttribute: {
          title: 'Display name attribute',
          description:
            "Attribute used to determine the group's name in XO. e.g.: `cn`",
          type: 'string',
        },
        displayNamePrefix: {
          title: 'Display name prefix',
          description:
            'Optionally set a prefix for group names in XO imported from the LDAP directory. e.g.: `LDAP-`',
          type: 'string',
        },
        membersAttribute: {
          title: 'Members attribute',
          description:
            'Attribute used to find the members of a group. e.g.: `memberUid`. The values must reference the user IDs (cf. user ID attribute)',
          type: 'string',
        },
      },
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
      groups,
      uri,
      users,
    } = conf

    this._credentials = credentials
    this._serverUri = uri
    this._searchBase = searchBase
    this._searchFilter = searchFilter
    this._startTls = startTls
    this._groupsConfig = groups
    this._usersConfig = users
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

  _getDirectoryUri() {
    return new URL(encodeURIComponent(this._searchBase), this._serverUri).href
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

          const ldapId = entry[this._usersConfig.idAttribute]
          const user = await this._synchronizeUser(ldapId, username)

          if (this._groupsConfig.synchronize) {
            await this._synchronizeGroups(user)
          }

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

  // Synchronize user's groups OR all groups if no user is passed
  async _synchronizeGroups(user) {
    const logger = this._logger
    const client = new Client(this._clientOpts)
    const directoryUri = this._getDirectoryUri()

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
      logger('syncing groups...')
      const {
        base,
        displayNameAttribute,
        displayNamePrefix = '',
        filter,
        idAttribute,
        membersAttribute,
      } = this._groupsConfig
      const { searchEntries: ldapGroups } = await client.search(base, {
        scope: 'sub',
        filter: filter || '', // may be undefined
      })

      const xoUsers =
        user !== undefined &&
        (await this._xo.getAllUsers()).filter(
          user =>
            user.authProviders !== undefined &&
            directoryUri in user.authProviders
        )
      const xoGroups = await this._xo.getAllGroups()

      // For each LDAP group:
      // - create/update/delete the corresponding XO group
      // - add/remove the LDAP-provided users
      // One by one to avoid race conditions
      for (const ldapGroup of ldapGroups) {
        const groupLdapId = ldapGroup[idAttribute]
        const groupLdapName =
          displayNamePrefix + ldapGroup[displayNameAttribute]

        // Empty or undefined names/IDs are invalid
        if (!groupLdapId || !groupLdapName) {
          logger(`Invalid group ID (${groupLdapId}) or name (${groupLdapName})`)
          continue
        }

        let ldapGroupMembers = ldapGroup[membersAttribute]
        ldapGroupMembers = Array.isArray(ldapGroupMembers)
          ? ldapGroupMembers
          : [ldapGroupMembers]

        // If a user was passed, only update the user's groups
        if (
          user !== undefined &&
          !ldapGroupMembers.includes(user.authProviders[directoryUri].id)
        ) {
          continue
        }

        let xoGroup
        const xoGroupIndex = xoGroups.findIndex(
          group =>
            group.provider === directoryUri &&
            group.providerGroupId === groupLdapId
        )

        if (xoGroupIndex === -1) {
          if (
            xoGroups.find(group => group.name === groupLdapName) !== undefined
          ) {
            // TODO: check against LDAP groups that are being created as well
            logger(`A group called ${groupLdapName} already exists`)
            continue
          }
          xoGroup = await this._xo.createGroup({
            name: groupLdapName,
            provider: directoryUri,
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

        const xoGroupMembers =
          xoGroup.users === undefined ? [] : xoGroup.users.slice(0)

        for (const ldapId of ldapGroupMembers) {
          const xoUser = xoUsers.find(
            user => user.authProviders[directoryUri].id === ldapId
          )
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
          xoGroups
            .filter(group => group.provider === directoryUri)
            .map(group => this._xo.deleteGroup(group.id))
        )
      }
    } finally {
      await client.unbind()
    }
  }

  async _synchronizeUser(ldapId, ldapUsername) {
    const xoUsers = await this._xo.getAllUsers()
    const directoryUri = this._getDirectoryUri()

    // Get the XO user bound to the LDAP user
    let xoUser = xoUsers.find(
      xoUser => xoUser.authProviders?.[directoryUri]?.id === ldapId
    )

    // If that XO user doesn't exist or doesn't have the correct username, there
    // is a chance that there is another XO user that already has that username
    let conflictingXoUser
    if (xoUser?.email !== ldapUsername) {
      conflictingXoUser = xoUsers.find(user => user.email === ldapUsername)

      if (conflictingXoUser !== undefined) {
        if (!this._usersConfig.merge) {
          throw new Error(
            `XO user with username ${ldapUsername} already exists`
          )
        }
        if (xoUser !== undefined) {
          // TODO: merge `conflictingXoUser` into `xoUser` and delete
          // `conflictingXoUser`. For now: keep the 2 users. Once implemented:
          // remove the `conflictingXoUser === undefined` condition on
          // `updateUser`.
        } else {
          xoUser = conflictingXoUser
        }
      }
    } else {
      return xoUser
    }

    if (xoUser === undefined) {
      xoUser = await this._xo.createUser({
        name: ldapUsername,
        authProviders: { [directoryUri]: { id: ldapId } },
      })
    } else {
      // If the user has other auth providers than LDAP: don't update the username
      await this._xo.updateUser(xoUser.id, {
        name:
          (xoUser.authProviders === undefined ||
            Object.keys(xoUser.authProviders).length < 2) &&
          conflictingXoUser === undefined // cf: TODO above
            ? ldapUsername
            : undefined,
        authProviders: {
          ...xoUser.authProviders,
          [directoryUri]: { id: ldapId },
        },
      })
    }

    return this._xo.getUser(xoUser.id)
  }
}

// ===================================================================

export default opts => new AuthLdap(opts)
