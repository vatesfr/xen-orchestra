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

// the claim each field of the profile of passport-openidconnect comes from
// (https://github.com/jaredhanson/passport-openidconnect/blob/master/lib/profile.js)
const CLAIM_OF_PROFILE_FIELD = { displayName: 'name', email: 'email', id: 'sub', username: 'preferred_username' }

function profileField(profile, usernameField) {
  return usernameField === 'email' ? profile?.emails?.[0]?.value : profile?.[usernameField]
}

/**
 * Whether the ID token carries the username: when an access token is issued, spec compliant
 * providers only put the claims of the requested scopes in the userinfo response, not in the ID
 * token (https://openid.net/specs/openid-connect-core-1_0.html#ScopeClaims)
 *
 * @param {string} usernameField
 * @param {object} claims - of the ID token
 * @returns {boolean}
 */
function hasUsername(usernameField, claims) {
  return (
    claims[CLAIM_OF_PROFILE_FIELD[usernameField] ?? usernameField] !== undefined || claims[usernameField] !== undefined
  )
}
exports.hasUsername = hasUsername

/**
 * The username, from the userinfo response when it was fetched, then from the ID token.
 *
 * @param {string} usernameField
 * @param {{ claims: object, idProfile?: object, uiProfile?: object }} sources
 * @returns {string | undefined}
 */
function resolveUsername(usernameField, { claims, idProfile, uiProfile }) {
  return (
    profileField(uiProfile, usernameField) ??
    profileField(idProfile, usernameField) ??
    // a field the profile does not map
    uiProfile?._json?.[usernameField] ??
    claims[usernameField]
  )
}
exports.resolveUsername = resolveUsername

/**
 * The groups of the user, from the userinfo response when it was fetched, then from the ID token.
 *
 * @returns {string[]}
 */
function resolveGroups({ claims, uiProfile }) {
  const groups = uiProfile?._json?.groups ?? claims.groups
  if (groups === undefined) {
    return []
  }
  // Some OIDC auth provider send a string instead of an array when there is only 1 group
  return Array.isArray(groups) ? groups : [groups]
}
exports.resolveGroups = resolveGroups

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

    const strategyOptions = {
      ...conf,
      // the userinfo endpoint is only asked when the ID token lacks the username, e.g. a spec
      // compliant provider which issued an access token
      skipUserProfile: (req, claims) => conf.userInfoURL === undefined || hasUsername(usernameField, claims),
    }

    this.#unregisterPassportStrategy = xo.registerPassportStrategy(
      // the arity of the verify function tells passport-openidconnect to pass both profiles
      new Strategy(
        strategyOptions,
        async (issuer, uiProfile, idProfile, context, idToken, accessToken, refreshToken, params, done) => {
          try {
            const claims = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString())
            const sources = { claims, idProfile, uiProfile }

            const name = resolveUsername(usernameField, sources)
            if (name === undefined) {
              throw new Error(
                `Could not find username: field "${usernameField}" is missing from the OIDC profile. Ensure the required scopes are configured and granted by your identity provider.`
              )
            }

            const user = await xo.registerUser2('oidc:' + issuer, {
              user: { id: idProfile.id, name },
            })

            await this._synchronizeGroups(user, resolveGroups(sources))

            done(null, user)
          } catch (error) {
            done(error.message)
          }
        }
      ),
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
