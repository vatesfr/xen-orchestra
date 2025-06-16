'use strict'

const { join } = require('node:path/posix')
const { Strategy } = require('passport-openidconnect')

// ===================================================================

const DISCOVERABLE_SETTINGS = ['authorizationURL', 'issuer', 'userInfoURL', 'tokenURL']

exports.configurationSchema = {
  type: 'object',
  properties: {
    discoveryURL: {
      description:
        'The OIDC discovery URL provided by your identity provider.\n\nIf this field is not used, you will need to manually enter settings in the *Advanced* section.',
      title: 'Auto-discovery URL',
      type: 'string',
    },
    clientID: {
      description: 'The client ID from your identity provider.',
      title: 'Client identifier (key)',
      type: 'string',
    },
    clientSecret: {
      description: 'Your client secret.',
      title: 'Client secret',
      type: 'string',
    },

    advanced: {
      title: 'Advanced',
      type: 'object',
      default: {},
      properties: {
        authorizationURL: { title: 'Authorization URL', type: 'string' },
        callbackURL: {
          description: 'The redirect URI for OIDC responses.',
          title: 'Callback URL',
          default: '/signin/oidc/callback',
          type: 'string',
        },
        issuer: { title: 'Issuer', type: 'string' },
        tokenURL: { title: 'Token URL', type: 'string' },
        userInfoURL: { title: 'User info URL', type: 'string' },
        usernameField: {
          default: 'username',
          description: 'Field to use as the XO username (e.g. `displayName`, `username` or `email`)',
          title: 'Username field',
          type: 'string',
        },
        scope: {
          description: `List of scopes from which to request profile information.

Scopes should be listed separated by a single whitespace.

Note: The \`openid\` scope is implicitely included.
`,
          default: 'profile',
          title: 'Scopes',
          type: 'string',
        },
      },
    },
  },
  required: ['clientID', 'clientSecret'],
  anyOf: [
    { required: ['discoveryURL'] },
    { required: ['advanced'], properties: { advanced: { type: 'object', required: DISCOVERABLE_SETTINGS } } },
  ],
}

// ===================================================================

const WELL_KNOWN_ENDPOINT = '/.well-known/openid-configuration'

class AuthOidc {
  #conf
  #unregisterPassportStrategy
  #xo

  constructor(xo) {
    this.#xo = xo
  }

  async configure({ advanced, ...conf }, { loaded }) {
    this.#conf = { ...advanced, ...conf }

    if (loaded) {
      await this.unload()
      await this.load()
    }
  }

  async load() {
    const xo = this.#xo
    const { discoveryURL, usernameField, ...conf } = this.#conf

    if (discoveryURL !== undefined) {
      let url = discoveryURL
      let onError

      // try with the well-known path first
      if (!url.endsWith(WELL_KNOWN_ENDPOINT)) {
        url = join(url, WELL_KNOWN_ENDPOINT)

        // on error, retry with the original URL
        onError = () => this.#xo.httpRequest(discoveryURL)
      }

      const res = await this.#xo.httpRequest(url).catch(onError)
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
          // See https://github.com/jaredhanson/passport-openidconnect/blob/master/lib/profile.js
          const { id } = profile
          done(
            null,
            await xo.registerUser2('oidc:' + issuer, {
              user: { id, name: usernameField === 'email' ? profile.emails[0].value : profile[usernameField] },
            })
          )
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
