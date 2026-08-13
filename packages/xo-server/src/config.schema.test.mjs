import assert from 'assert/strict'
import test from 'node:test'
import { applySchema } from './config.schema.mjs'

const { describe, it } = test

describe('applySchema()', function () {
  it('redacts sensitive values', function () {
    const input = {
      http: {
        sessionSecret: 'super-secret-value',
      },
    }

    const result = applySchema(input)

    assert.deepEqual(result, {
      http: {
        sessionSecret: '**REDACTED**',
      },
    })
  })

  it('keeps safe values', function () {
    const input = {
      http: {
        port: 8080,
      },
    }

    const result = applySchema(input)

    assert.deepEqual(result, {
      http: {
        port: 8080,
      },
    })
  })

  it('redacts unknown keys that are not in schema', function () {
    const input = {
      unknownFeature: {
        password: 'secret',
      },
    }

    const result = applySchema(input)

    assert.deepEqual(result, {
      unknownFeature: '**REDACTED**',
    })
  })

  it('accepts partial configuration', function () {
    const input = {
      redis: {
        socket: '/tmp/redis.sock',
      },
    }

    const result = applySchema(input)

    assert.deepEqual(result, {
      redis: {
        socket: '/tmp/redis.sock',
      },
    })
  })

  it('returns an empty object for an empty configuration', function () {
    assert.deepEqual(applySchema({}), {})
  })

  it('does not leak known secrets', function () {
    const config = {
      authentication: {
        providers: {
          ldap: {
            bindDn: 'cn=xo,dc=company,dc=lan',
            bindPassword: 'LDAP_BIND_PASSWORD',
            host: 'ldap.company.lan',
            type: 'ldap',
          },
          oidc: {
            clientId: 'xo-server',
            clientSecret: 'OIDC_CLIENT_SECRET',
            privateKey: 'PRIVATE_KEY_MATERIAL',
            issuer: 'https://idp.company.lan',
            type: 'oidc',
          },
          saml: {
            certificate: 'PRIVATE_KEY_MATERIAL',
            entryPoint: 'https://idp.company.lan/saml',
            type: 'saml',
          },
        },
      },

      http: {
        cookies: {
          sameSite: true,
          secret: 'COOKIE_SECRET',
          secure: true,
        },
        proxies: {
          '/api': 'http://user:PROXY_PASSWORD@proxy.company.lan:3128',
        },
      },
    }

    const output = JSON.stringify(applySchema(config))

    for (const secret of [
      'PROXY_PASSWORD',
      'COOKIE_SECRET',
      'LDAP_BIND_PASSWORD',
      'OIDC_CLIENT_SECRET',
      'PRIVATE_KEY_MATERIAL',
    ]) {
      assert.equal(output.includes(secret), false, `secret leaked: ${secret}`)
    }
  })
})
