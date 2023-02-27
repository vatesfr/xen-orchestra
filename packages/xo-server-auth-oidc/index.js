'use strict'

const { Strategy } = require('passport-openidconnect')

// ===================================================================

const DISCOVERABLE_SETTINGS = ['authorizationURL', 'issuer', 'userInfoURL', 'tokenURL']

exports.configurationSchema = {
  type: 'object',
  properties: {
    discoveryURL: {
      description: 'If this field is not used, you will need to manually enter settings in the *Advanced* section.',
      title: 'Auto-discovery URL',
      type: 'string',
    },
    clientID: { title: 'Client identifier (key)', type: 'string' },
    clientSecret: { title: 'Client secret', type: 'string' },

    advanced: {
      title: 'Advanced',
      type: 'object',
      properties: {
        authorizationURL: { title: 'Authorization URL', type: 'string' },
        callbackURL: {
          description: 'Default to https://<xo.company.net>/signin/oidc/callback`.',
          title: 'Callback URL',
          type: 'string',
        },
        issuer: { title: 'Issuer', type: 'string' },
        tokenURL: { title: 'Token URL', type: 'string' },
        userInfoURL: { title: 'User info URL', type: 'string' },
        usernameField: {
          default: 'username',
          description: 'Field to use as the XO username',
          title: 'Username field',
          type: 'string',
        },
      },
    },
  },
  required: ['clientID', 'clientSecret'],
  anyOf: [{ required: ['discoveryURL'] }, { properties: { advanced: { required: DISCOVERABLE_SETTINGS } } }],
}

// ===================================================================

class AuthOidc {
  #conf
  #unregisterPassportStrategy
  #xo

  constructor(xo) {
    this.#xo = xo
  }

  async configure({ advanced, ...conf }, { loaded }) {
    this.#conf = { callbackURL: '/signin/oidc/callback', ...advanced, ...conf }

    if (loaded) {
      await this.unload()
      await this.load()
    }
  }

  async load() {
    const xo = this.#xo
    const { discoveryURL, usernameField, ...conf } = this.#conf

    if (discoveryURL !== undefined) {
      const res = await this.#xo.httpRequest(discoveryURL)
      const data = await res.json()

      for (const key of DISCOVERABLE_SETTINGS) {
        if (!conf[key]) {
          conf[key] = data[key.endsWith('URL') ? key.slice(0, -3).toLowerCase() + '_endpoint' : key]
        }
      }
    }

    this.#unregisterPassportStrategy = xo.registerPassportStrategy(
      new Strategy(conf, async (issuer, profile, done) => {
        try {
          const { id, [usernameField]: name } = profile
          done(null, await xo.registerUser2('oidc:' + issuer, { user: { id, name } }))
        } catch (error) {
          done(error.message)
        }
      }),
      { label: 'OpenID Connect', name: 'oidc' }
    )
  }

  unload() {
    this.#unregisterPassportStrategy()
  }
}

// ===================================================================

exports.default = ({ xo }) => new AuthOidc(xo)
