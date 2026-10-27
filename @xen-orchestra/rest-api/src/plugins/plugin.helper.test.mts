import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { XoPlugin } from '@vates/types'
import { OBFUSCATED_VALUE } from '@vates/obfuscate'

import { assertNoUnknownProperties, obfuscatePluginSecrets } from './plugin.helper.mjs'

const sdnControllerSchema = {
  type: 'object',
  properties: {
    'cert-dir': { type: 'string' },
    'override-certs': { type: 'boolean', default: false },
  },
}

const unknownPaths = (fn: () => void) => {
  try {
    fn()
  } catch (error) {
    return (error as { data: { errors: { instancePath: string }[] } }).data.errors.map(error => error.instancePath)
  }
  assert.fail('should have thrown')
}

describe('assertNoUnknownProperties', () => {
  it('accepts the declared properties', () => {
    assertNoUnknownProperties({ 'cert-dir': '/etc/xo-server/sdn', 'override-certs': true }, sdnControllerSchema)
  })

  it('rejects the properties of another plugin', () => {
    const auditSchema = { type: 'object', properties: { active: { type: 'boolean' } } }

    assert.deepEqual(
      unknownPaths(() => assertNoUnknownProperties({ 'cert-dir': '/etc/xo-server/sdn' }, auditSchema)),
      ['/cert-dir']
    )
  })

  it('rejects unknown nested properties', () => {
    const schema = {
      type: 'object',
      properties: { transport: { type: 'object', properties: { host: { type: 'string' } } } },
    }

    assert.deepEqual(
      unknownPaths(() => assertNoUnknownProperties({ transport: { host: 'smtp.example.org', foo: 'bar' } }, schema)),
      ['/transport/foo']
    )
  })

  it('checks the items of arrays', () => {
    const schema = {
      type: 'object',
      properties: {
        hooks: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' } } } },
      },
    }

    assert.deepEqual(
      unknownPaths(() =>
        assertNoUnknownProperties({ hooks: [{ url: 'https://example.org' }, { foo: 'bar' }] }, schema)
      ),
      ['/hooks/1/foo']
    )
  })

  it('accepts the properties declared in anyOf and oneOf', () => {
    const schema = {
      type: 'object',
      properties: { clientID: { type: 'string' } },
      anyOf: [{ properties: { discoveryURL: { type: 'string' } } }],
      oneOf: [{ properties: { issuer: { type: 'string' } } }],
    }

    assertNoUnknownProperties({ clientID: 'xo', discoveryURL: 'https://example.org', issuer: 'xo' }, schema)
  })

  it('reports every unknown property', () => {
    assert.deepEqual(
      unknownPaths(() =>
        assertNoUnknownProperties({ foo: 'bar', cert_dir: '/etc/xo-server/sdn' }, sdnControllerSchema)
      ),
      ['/foo', '/cert_dir']
    )
  })
})

describe('obfuscatePluginSecrets', () => {
  const plugin = (name: string, configuration?: object) => ({ id: name, name, configuration }) as unknown as XoPlugin

  it('obfuscates the secrets that are not named like a password or a token', () => {
    assert.deepEqual(
      obfuscatePluginSecrets(plugin('auth-oidc', { clientID: 'xo', clientSecret: 'secret' })).configuration,
      {
        clientID: 'xo',
        clientSecret: OBFUSCATED_VALUE,
      }
    )
  })

  it('does not modify the plugin', () => {
    const github = plugin('auth-github', { clientID: 'xo', clientSecret: 'secret' })
    obfuscatePluginSecrets(github)
    assert.deepEqual(github.configuration, { clientID: 'xo', clientSecret: 'secret' })
  })

  it('ignores the plugins without such secrets or without configuration', () => {
    const sdnController = plugin('sdn-controller', { 'cert-dir': '/etc/xo-server/sdn' })
    assert.equal(obfuscatePluginSecrets(sdnController), sdnController)

    const openmetrics = plugin('openmetrics')
    assert.equal(obfuscatePluginSecrets(openmetrics), openmetrics)
  })
})
