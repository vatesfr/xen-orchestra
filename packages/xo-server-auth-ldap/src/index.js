/* eslint no-throw-literal: 0 */

import ensureArray from 'ensure-array'
import fromCallback from 'promise-toolbox/fromCallback'
import pTimeout from 'promise-toolbox/timeout'
import { Client } from 'ldapts'
import { createLogger } from '@xen-orchestra/log'
import { Filter } from 'ldapts/filters/Filter'
import { readFile } from 'fs'

const logger = createLogger('xo:xo-server-auth-ldap')

// ===================================================================

const CONNECT_TIMEOUT_MS = 5000
// ldapts timeout: only fires if connectTimeout does not fire
const LDAPTS_TIMEOUT_MS = CONNECT_TIMEOUT_MS * 4
const FAILOVER_ERRORS = new Set(['ECONNREFUSED', 'ETIMEDOUT', 'EHOSTUNREACH', 'ECONNRESET', 'ENOTFOUND'])

function throwConnectTimeout() {
  const err = new Error('LDAP connect timeout')
  err.code = 'ETIMEDOUT'
  throw err
}

const isFailoverError = err =>
  FAILOVER_ERRORS.has(err.code) || (Array.isArray(err.errors) && err.errors.some(e => FAILOVER_ERRORS.has(e.code)))

const { escape } = Filter.prototype

function isDnField(field) {
  const normalized = field.toLowerCase().trim()
  return normalized === 'dn' || normalized === 'distinguishedname'
}

const VAR_RE = /\{\{([^}]+)\}\}/g
const evalFilter = (filter, vars) =>
  filter.replace(VAR_RE, (_, name) => {
    const value = vars[name]

    if (value === undefined) {
      throw new Error('invalid variable: ' + name)
    }

    return escape(value)
  })

const CERT_DESCRIPTION = `
Paths to CA certificates to use when connecting to SSL-secured LDAP servers.

If not specified, it will use a default set of well-known CAs.
`.trim()

const DN_DESCRIPTION = `
Full distinguished name of the user permitted to search the LDAP directory for the user to authenticate.

Example: uid=xoa-auth,ou=people,dc=company,dc=net

For Microsoft Active Directory, it can also be \`<user>@<domain>\`.
`.trim()

const FILTER_DESCRIPTION = `
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
`.trim()

const DOMAIN_PROPERTIES = {
  uri: {
    title: 'URI',
    description: 'URI of the LDAP server.',
    type: 'string',
  },
  failoverUris: {
    title: 'Failover URIs',
    description: 'Backup URIs tried in order on TCP-level failure of the primary URI.',
    type: 'array',
    items: {
      type: 'string',
    },
  },
  certificateAuthorities: {
    title: 'Certificate Authorities',
    description: CERT_DESCRIPTION,
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
    default: true,
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
        description: DN_DESCRIPTION,
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
    description: FILTER_DESCRIPTION,
    type: 'string',
    default: '(uid={{name}})',
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
}

const DOMAIN_REQUIRED = ['uri', 'base', 'userIdAttribute']

const DOMAIN_SCHEMA = {
  type: 'object',
  properties: DOMAIN_PROPERTIES,
  required: DOMAIN_REQUIRED,
}

export const configurationSchema = {
  type: 'object',
  properties: {
    ...DOMAIN_PROPERTIES,
    additionalDomains: {
      title: 'Additional domains',
      description: 'Extra LDAP domains tried in order when the primary domain returns no match.',
      type: 'array',
      items: DOMAIN_SCHEMA,
    },
  },
  required: DOMAIN_REQUIRED,
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

  async _buildDomainConfig(raw, isPrimary) {
    const tlsOptions = { rejectUnauthorized: raw.checkCertificate }
    if (raw.certificateAuthorities) {
      tlsOptions.ca = await Promise.all(raw.certificateAuthorities.map(path => fromCallback(readFile, path)))
    }

    return {
      isPrimary,
      uris: [raw.uri, ...(raw.failoverUris ?? [])],
      tlsOptions,
      startTls: raw.startTls ?? false,
      credentials: raw.bind,
      searchBase: raw.base,
      searchFilter: raw.filter ?? '(uid={{name}})',
      userIdAttribute: raw.userIdAttribute,
      groupsConfig: raw.groups,
      provider: isPrimary ? 'ldap' : raw.uri,
    }
  }

  async configure(conf) {
    const primaryDomain = await this._buildDomainConfig(conf, true)
    const additionalDomains = await Promise.all(
      (conf.additionalDomains ?? []).map(raw => this._buildDomainConfig(raw, false))
    )

    const uris = new Set()
    for (const { uris: domainUris } of [primaryDomain, ...additionalDomains]) {
      const primaryUri = domainUris[0]
      if (uris.has(primaryUri)) {
        throw new Error(`Duplicate LDAP URI: "${primaryUri}". Each domain must have a unique URI.`)
      }
      uris.add(primaryUri)
    }

    this._primaryDomain = primaryDomain
    this._domains = [primaryDomain, ...additionalDomains]
  }

  async _connectAndBind(domain = this._primaryDomain) {
    let lastError
    for (const uri of domain.uris) {
      const clientOpts = { url: uri, maxConnections: 5, connectTimeout: LDAPTS_TIMEOUT_MS }
      if (uri.startsWith('ldaps:')) {
        clientOpts.tlsOptions = domain.tlsOptions
      }
      const client = new Client(clientOpts)
      try {
        if (domain.startTls) {
          await pTimeout.call(client.startTLS(domain.tlsOptions), CONNECT_TIMEOUT_MS, throwConnectTimeout)
        }
        const { credentials } = domain
        if (credentials) {
          logger.debug(`attempting to bind as ${credentials.dn}...`)
          await (domain.startTls
            ? client.bind(credentials.dn, credentials.password)
            : pTimeout.call(client.bind(credentials.dn, credentials.password), CONNECT_TIMEOUT_MS, throwConnectTimeout))
          logger.debug(`successfully bound as ${credentials.dn}`)
        }
        return client
      } catch (err) {
        await client.unbind().catch(() => {})
        if (!isFailoverError(err)) throw err
        lastError = err
        logger.warn(`LDAP URI ${uri} unreachable (${err.code ?? err.errors?.[0]?.code}), trying next…`)
      }
    }
    throw lastError
  }

  load() {
    this._xo.registerAuthenticationProvider(this._authenticate)
    this._removeApiMethods = this._xo.addApiMethods({
      ldap: {
        synchronizeGroups: async ({ domainIndex } = {}) => {
          const domains = domainIndex !== undefined ? [this._domains[domainIndex]] : this._domains
          for (const domain of domains) {
            await this._synchronizeGroups({ domain })
          }
        },
        testConnections: () => this.testConnections(),
      },
    })
  }

  async testConnection(uri, domain) {
    const entry = { uri, domain: domain.provider, ok: true }
    try {
      const client = await this._connectAndBind({ ...domain, uris: [uri] })
      try {
        if (domain.groupsConfig !== undefined) {
          await client.search(domain.groupsConfig.base, { scope: 'base', sizeLimit: 1 })
        }
      } catch (err) {
        entry.ok = false
        entry.error = `groups base "${domain.groupsConfig.base}" unreachable: ${err.message}`
      } finally {
        await client.unbind()
      }
    } catch (err) {
      entry.ok = false
      entry.error = err.message
    }
    return entry
  }

  async testConnections() {
    const results = []
    for (const domain of this._domains) {
      for (const uri of domain.uris) {
        results.push(await this.testConnection(uri, domain))
      }
    }
    return results
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

    for (const domain of this._domains) {
      try {
        const result = await this._authenticateInDomain(username, password, domain)
        if (result !== null) {
          return result
        }
      } catch (err) {
        logger.warn(`domain ${domain.provider} unreachable, trying next: ${err.message}`)
      }
    }
    return null
  }

  async _authenticateInDomain(username, password, domain) {
    const client = await this._connectAndBind(domain)

    try {
      // Search for the user.
      logger.debug('searching for entries...')
      const { searchEntries: entries } = await client.search(domain.searchBase, {
        scope: 'sub',
        filter: evalFilter(domain.searchFilter, { name: username }),
      })
      logger.debug(`${entries.length} entries found`)

      // Try to find an entry which can be bound with the given password.
      for (const entry of entries) {
        try {
          logger.debug(`attempting to bind as ${entry.dn}`)
          await client.bind(entry.dn, password)
          logger.info(`successfully bound as ${entry.dn} => ${username} authenticated via ${domain.provider}`)
          logger.debug(JSON.stringify(entry, null, 2))

          // CLI test: don't register user/sync groups
          if (this._xo === undefined) {
            return {}
          }

          const ldapId = entry[domain.userIdAttribute]
          if (ldapId === undefined) {
            throw new Error(`could not find field ${domain.userIdAttribute} on user ${username}`)
          }

          const userId = domain.isPrimary ? ldapId : `${domain.uris[0]}:${ldapId}`
          const user = await this._xo.registerUser2(domain.provider, {
            user: { id: userId, name: username },
          })

          if (domain.groupsConfig !== undefined) {
            try {
              await this._synchronizeGroups({
                domain,
                user,
                memberId: entry[domain.groupsConfig.membersMapping.userAttribute],
              })
            } catch (error) {
              logger.error(`failed to synchronize groups: ${error.message}`)
            }
          }

          return { userId: user.id }
        } catch (error) {
          logger.debug(`failed to bind as ${entry.dn}: ${error.message}`)
        }
      }

      logger.debug(`could not authenticate ${username} against ${domain.provider}`)
      return null
    } finally {
      await client.unbind()
    }
  }

  // Synchronize user's groups OR all groups for a domain if no user is passed
  async _synchronizeGroups({ domain = this._primaryDomain, user, memberId } = {}) {
    const client = await this._connectAndBind(domain)

    try {
      logger.info('syncing groups...')
      const { provider, userIdAttribute } = domain
      const { base: groupsBase, displayNameAttribute, filter, idAttribute, membersMapping } = domain.groupsConfig
      const { searchEntries: ldapGroups } = await client.search(groupsBase, {
        scope: 'sub',
        filter: filter || '', // may be undefined
      })

      const xoUsers =
        user === undefined &&
        (await this._xo.getAllUsers()).filter(
          user => user.authProviders !== undefined && Object.keys(user.authProviders).some(k => k.startsWith('ldap'))
        )
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

        // Primary domain keeps the bare group ID for backward compatibility.
        // Additional domains prefix with their URI to guarantee uniqueness across domains
        const scopedGroupId = domain.isPrimary ? groupLdapId : `${domain.uris[0]}:${groupLdapId}`

        let xoGroup
        const xoGroupIndex = xoGroups.findIndex(
          group => group.provider === 'ldap' && group.providerGroupId === scopedGroupId
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
            providerGroupId: scopedGroupId,
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

        const { userAttribute } = membersMapping
        const search = isDnField(userAttribute)
          ? memberId => client.search(memberId, { scope: 'base' })
          : memberId =>
              client.search(domain.searchBase, {
                scope: 'sub',
                filter: `(${escape(userAttribute)}=${escape(memberId)})`,
                sizeLimit: 1,
              })
        for (const memberId of ldapGroupMembers) {
          const {
            searchEntries: [ldapUser],
          } = await search(memberId)

          if (ldapUser === undefined) {
            logger.error(
              `LDAP user ${memberId} belongs to group ${groupLdapName} but could not be found by searching ${userAttribute}=${memberId} in ${domain.searchBase}`
            )
            continue
          }

          const scopedUserId = domain.isPrimary
            ? ldapUser[userIdAttribute]
            : `${domain.uris[0]}:${ldapUser[userIdAttribute]}`
          const xoUser = xoUsers.find(user => user.authProviders[provider]?.id === scopedUserId)
          if (xoUser === undefined) {
            logger.debug(
              `LDAP user ${ldapUser[userIdAttribute]} belongs to group ${groupLdapName} but the corresponding XO user could not be found`
            )
            continue
          }
          // If the user exists in XO, should be a member of the LDAP-provided
          // group but isn't: add it
          const userIdIndex = xoGroupMembers.findIndex(id => id === xoUser.id)
          if (userIdIndex !== -1) {
            logger.debug(
              `LDAP user ${ldapUser[userIdAttribute]} belongs to group ${groupLdapName} and is already a member of the corresponding XO group ${xoGroup.name}`
            )
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
        const isThisDomainGroup = domain.isPrimary
          ? group => !group.providerGroupId.includes('://')
          : group => group.providerGroupId.startsWith(domain.uris[0] + ':')
        await Promise.all(
          xoGroups
            .filter(group => group.provider === 'ldap' && isThisDomainGroup(group))
            .map(group => this._xo.deleteGroup(group.id))
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
