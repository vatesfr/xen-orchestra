import createJsonSchemaValidator from 'is-my-json-valid'
import map from 'lodash.map'

import {
  NoSuchObject,
  InvalidParameters
} from '../api-errors'

// ===================================================================

// Plugin object structure (using [JSON Schema](http://json-schema.org)):
({
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'unique identifier for this plugin'
    },
    name: {
      type: 'string',
      description: 'unique human readable name for this plugin'
    },
    autoload: {
      type: 'boolean',
      description: 'whether this plugin is loaded on startup'
    },
    loaded: {
      type: 'boolean',
      description: 'whether or not this plugin is currently loaded'
    },
    configuration: {
      type: 'object'
    },
    configurationSchema: {
      $ref: 'http://json-schema.org/draft-04/schema#'
    }
  }
})

// ===================================================================

const plugins = {
  'auth-github': {
    name: 'auth-github',
    autoload: true,
    loaded: true,
    configuration: {
      clientID: 'c2f2f881062f170e2ec3',
      clientSecret: '4335e70f62e2dbb7917df0126b1015b5617bceea'
    },
    configurationSchema: {
      type: 'object',
      properties: {
        clientID: {
          type: 'string'
        },
        clientSecret: {
          type: 'string'
        }
      },
      required: ['clientID', 'clientSecret']
    }
  },
  'auth-ldap': {
    name: 'auth-ldap',
    autoload: true,
    loaded: true,
    configuration: {
      uri: 'ldap://ldap.example.org',
      certificateAuthorities: [],
      checkCertificate: true,
      bind: {
        dn: 'cn=admin,ou=people,dc=example,dc=org',
        password: 'secret'
      },
      base: 'ou=people,dc=example,dc=org',
      filter: '(uid={{name}})'
    },
    configurationSchema: {
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
          type: 'boolean'
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
              description: 'Password of the user permitted ot search the LDAP directory.',
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

Default is \`(uid={{name}})\`.
`.trim(),
          type: 'string'
        }
      },
      required: ['uri', 'base']
    }
  },
  'auth-saml': {
    name: 'auth-saml',
    autoload: true,
    loaded: true,
    unloadable: false,
    configuration: {
      cert: 'MIIFBjCCAu4CCQDBMhqko5KQODANBgkqhkiG9w0BAQ ...',
      entryPoint: 'https://saml.example.org/signin/',
      issuer: 'xen-orchestra',
      usernameField: 'uid'
    },
    configurationSchema: {
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
  }
}
for (const id in plugins) {
  plugins[id].id = id
}

function getPlugin (id) {
  const plugin = plugins[id]
  if (!plugin) {
    throw new NoSuchObject(id, 'plugin')
  }

  return plugin
}

// ===================================================================

export function get () {
  return map(plugins)
}

get.description = 'returns a list of all installed plugins'

get.permission = 'admin'

// -------------------------------------------------------------------

export function configure ({ id, configuration }) {
  const plugin = getPlugin(id)

  if (!plugin.configurationSchema) {
    throw new InvalidParameters('plugin not configurable')
  }

  const validate = createJsonSchemaValidator(plugin.configurationSchema)
  if (!validate(configuration)) {
    throw new InvalidParameters('the configuration is not valid')
  }

  plugin.configuration = configuration
}

configure.description = 'sets the configuration of a plugin'

configure.params = {
  id: {
    type: 'string'
  },
  configuration: {}
}

configure.permission = 'admin'

// -------------------------------------------------------------------

export function disableAutoload ({ id }) {
  const plugin = getPlugin(id)

  if (!plugin.autoload) {
    throw new InvalidParameters('plugin already not automatically loaded')
  }

  plugin.autoload = false
}

disableAutoload.description = ''

disableAutoload.params = {
  id: {
    type: 'string'
  }
}

disableAutoload.permission = 'admin'

// -------------------------------------------------------------------

export function enableAutoload ({ id }) {
  const plugin = getPlugin(id)
  if (plugin.autoload) {
    throw new InvalidParameters('plugin already automatically loaded')
  }

  plugin.autoload = true
}

enableAutoload.description = 'enables a plugin, allowing it to be loaded'

enableAutoload.params = {
  id: {
    type: 'string'
  }
}

enableAutoload.permission = 'admin'

// -------------------------------------------------------------------

export function load ({ id }) {
  const plugin = getPlugin(id)
  if (plugin.loaded) {
    throw new InvalidParameters('plugin already loaded')
  }

  plugin.loaded = true
}

load.description = 'loads a plugin'

load.params = {
  id: {
    type: 'string'
  }
}

load.permission = 'admin'

// -------------------------------------------------------------------

export async function unload ({ id }) {
  const plugin = getPlugin(id)
  if (!plugin.loaded) {
    throw new InvalidParameters('plugin already unloaded')
  }

  if (plugin.unloadable === false) {
    throw new InvalidParameters('plugin cannot be unloaded')
  }

  plugin.loaded = false
}

unload.description = 'unloads a plugin'

unload.params = {
  id: {
    type: 'string'
  }
}

unload.permission = 'admin'
