import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { findLeaks, OBFUSCATED_VALUE } from '@vates/obfuscate'

import {
  collectConfigSecrets,
  collectXapiSecrets,
  getXapiTypeGroup,
  redactConfigEntry,
  redactXapiRecord,
} from './support-bundle.helper.mjs'

describe('redactConfigEntry', () => {
  it('keeps the remote URL structure but not its credentials, encryption key and mount options', () => {
    const remotes = [
      {
        id: 'r1',
        name: 'smb',
        url: 'smb://admin:smb-password@WORKGROUP\\\\nas\\share/backups?encryptionKey=%22aes-key-1234%22',
        options: 'vers=3.0,password=other-password',
      },
      { id: 'r2', name: 's3', url: 's3://ACCESSKEY:s3-secret-key@s3.example.org/bucket/dir' },
    ]

    const [smb, s3] = redactConfigEntry('remotes', remotes) as Record<string, string>[]

    assert.equal(smb.name, 'smb')
    assert.ok(smb.url.startsWith('smb://admin:'))
    assert.ok(smb.url.includes('nas'))
    assert.equal(smb.options, OBFUSCATED_VALUE)
    assert.ok(s3.url.includes('ACCESSKEY'))
    assert.ok(s3.url.includes('s3.example.org/bucket/dir'))
    assert.equal(s3.options, undefined)
    assert.deepEqual(findLeaks([smb, s3], ['smb-password', 'aes-key-1234', 'other-password', 's3-secret-key']), [])
  })

  it('replaces an unparsable remote URL', () => {
    const [remote] = redactConfigEntry('remotes', [{ url: 'foo://user:secret-value@host' }]) as Record<string, string>[]

    assert.equal(remote.url, OBFUSCATED_VALUE)
  })

  it('replaces the whole plugin configuration', () => {
    const plugins = [
      { id: 'transport-email', autoload: true, configuration: { transport: { host: 'smtp', user: 'u' } } },
    ]

    assert.deepEqual(redactConfigEntry('plugins', plugins), [
      { id: 'transport-email', autoload: true, configuration: OBFUSCATED_VALUE },
    ])
  })

  it('replaces sensitive fields of other entries', () => {
    const servers = [{ id: 's1', host: '10.0.0.1', username: 'root', password: 'pass', httpProxy: 'http://u:p@proxy' }]

    assert.deepEqual(redactConfigEntry('xenServers', servers), [
      { id: 's1', host: '10.0.0.1', username: 'root', password: OBFUSCATED_VALUE, httpProxy: OBFUSCATED_VALUE },
    ])
    assert.deepEqual(redactConfigEntry('users', [{ email: 'a', pw_hash: 'h' }]), [
      { email: 'a', pw_hash: OBFUSCATED_VALUE },
    ])
  })
})

describe('redactXapiRecord', () => {
  it('replaces sensitive device_config values and all VM xenstore_data values', () => {
    const pbd = { device_config: { target: '10.0.0.2', chapuser: 'u', chappassword: 'chap' } }
    const vm = { name_label: 'vm', xenstore_data: { 'vm-data/foo': 'bar' } }

    assert.deepEqual(redactXapiRecord('PBD', pbd), {
      device_config: { target: '10.0.0.2', chapuser: 'u', chappassword: OBFUSCATED_VALUE },
    })
    assert.deepEqual(redactXapiRecord('VM', vm), {
      name_label: 'vm',
      xenstore_data: { 'vm-data/foo': OBFUSCATED_VALUE },
    })
  })
})

describe('getXapiTypeGroup', () => {
  it('dispatches XAPI types to groups', () => {
    assert.equal(getXapiTypeGroup('VM'), 'vms')
    assert.equal(getXapiTypeGroup('VDI'), 'vms')
    assert.equal(getXapiTypeGroup('SR'), 'pools')
    assert.equal(getXapiTypeGroup('Cluster'), 'pools')
    assert.equal(getXapiTypeGroup('message'), 'xapiMessages')
    assert.equal(getXapiTypeGroup('secret'), undefined)
    assert.equal(getXapiTypeGroup('session'), undefined)
  })
})

describe('secrets collection', () => {
  it('collects values under sensitive keys, from remote URLs and XAPI secrets, ignoring short values and XAPI refs', () => {
    const secrets = new Set<string>()
    collectConfigSecrets(secrets, 'xenServers', [{ host: '10.0.0.1', password: 'server-password', useProxy: 'true' }])
    collectConfigSecrets(secrets, 'remotes', [{ url: 's3://ACCESSKEY:s3-secret-key@host/bucket' }])
    collectXapiSecrets(secrets, 'secret', { uuid: 'u', value: 'chap-secret' })
    collectXapiSecrets(secrets, 'Cluster', { cluster_token: { token: 'cluster-token-value' }, password: 'short' })
    collectXapiSecrets(secrets, 'pool', { repository_proxy_password: 'OpaqueRef:NULL' })

    assert.deepEqual([...secrets].sort(), ['chap-secret', 'cluster-token-value', 's3-secret-key', 'server-password'])
  })
})
