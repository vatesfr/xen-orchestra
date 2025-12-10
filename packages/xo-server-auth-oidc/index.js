'use strict'

/**
 * @typedef {import('@vates/types').XoUser} XoUser
 */

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

Note: The \`openid\` scope is implicitly included.
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
      new Strategy(conf, async (issuer, profile, context, idToken, done) => {
        try {
          const claims = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString())

          let groups = []
          if (claims.groups) {
            // Some OIDC auth provider send a string instead of an array when there is only 1 group
            groups = Array.isArray(claims.groups) ? claims.groups : [claims.groups]
          }

          // See https://github.com/jaredhanson/passport-openidconnect/blob/master/lib/profile.js
          const { id } = profile
          const user = await xo.registerUser2('oidc:' + issuer, {
            user: { id, name: usernameField === 'email' ? profile.emails[0].value : profile[usernameField] },
          })

          await this._synchronizeGroups(user, groups)

          done(null, user)
        } catch (error) {
          done(error.message)
        }
      }),
      { label: 'OpenID Connect', name: 'oidc' }
    )
  }

  /**
   * Synchronize user's groups.
   * Not private in order to be testable, but should be private.
   *
   * @param {XoUser} user
   * @param {string[]} oidcGroups
   *
   * @returns {Promise<void>}
   */
  async _synchronizeGroups(user, oidcGroups) {
    const xoGroups = await this.#xo.getAllGroups()

    for (const xoGroup of xoGroups) {
      // If the user is in a XO group that he is not a part of in OIDC, we remove him.
      if (xoGroup.provider === 'oidc' && xoGroup.users.includes(user.id) && !oidcGroups.includes(xoGroup.name)) {
        await this.#xo.removeUserFromGroup(user.id, xoGroup.id)
      }
    }

    for (const oidcGroupName of oidcGroups) {
      // Try to find the OIDC group in the XO groups by name.
      let xoGroup = xoGroups.find(group => group.provider === 'oidc' && group.name === oidcGroupName)
      if (xoGroup === undefined) {
        // If the OIDC group does not exist we create it.
        xoGroup = await this.#xo.createGroup({
          name: oidcGroupName,
          provider: 'oidc',
        })
      }

      // If the user is not part of the group, add him.
      if (xoGroup.users.find(xoGroupUser => xoGroupUser === user.id) === undefined) {
        await this.#xo.addUserToGroup(user.id, xoGroup.id)
      }
    }
  }

  unload() {
    this.#unregisterPassportStrategy()
  }
}

// ===================================================================

exports.default = ({ xo }) => new AuthOidc(xo)
