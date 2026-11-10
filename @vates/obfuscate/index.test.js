'use strict'

const { describe, it } = require('node:test')
const assert = require('assert').strict

const { findLeaks, obfuscate, OBFUSCATED_VALUE, redact } = require('./')

describe('redact()', () => {
  it('replaces sensitive entries at any depth, whatever their type, and keeps the keys', () => {
    const remote = {
      name: 'nas',
      url: 's3://key@host/bucket',
      encryptionKey: 'aes-key',
      proxy: { authenticationToken: 'proxy-token' },
      credentials: [{ username: 'admin', password: 'pass', secret: { value: 'chap' } }],
    }

    assert.deepEqual(redact(remote), {
      name: 'nas',
      url: 's3://key@host/bucket',
      encryptionKey: OBFUSCATED_VALUE,
      proxy: { authenticationToken: OBFUSCATED_VALUE },
      credentials: [{ username: 'admin', password: OBFUSCATED_VALUE, secret: OBFUSCATED_VALUE }],
    })
  })

  it('catches keys missed by obfuscate()', () => {
    const plugin = { apiKey: 'k', cluster_token: 't', secretAccessKey: 's', pw_hash: 'h' }

    assert.deepEqual(redact(plugin), {
      apiKey: OBFUSCATED_VALUE,
      cluster_token: OBFUSCATED_VALUE,
      secretAccessKey: OBFUSCATED_VALUE,
      pw_hash: OBFUSCATED_VALUE,
    })
    assert.equal(obfuscate(plugin).apiKey, 'k')
  })

  it('does not alter obfuscate() behavior', () => {
    assert.deepEqual(obfuscate({ password: 'p', secret: 's' }), { password: OBFUSCATED_VALUE, secret: 's' })
  })

  it('accepts a custom predicate', () => {
    assert.deepEqual(
      redact({ a: 1, b: { a: 2, c: 3 } }, key => key === 'a'),
      { a: OBFUSCATED_VALUE, b: { a: OBFUSCATED_VALUE, c: 3 } }
    )
  })

  it('keeps non-object values as is', () => {
    assert.equal(redact('password'), 'password')
    assert.equal(redact(null), null)
  })
})

describe('findLeaks()', () => {
  it('returns paths of values containing a secret', () => {
    const taskLog = {
      result: {
        message: 'mount failed: smb://admin:hunter2@nas/share',
        call: { params: ['* session id *', { device_config: { chappassword: 'chap-secret' } }] },
      },
      status: 'failure',
    }

    assert.deepEqual(findLeaks(taskLog, ['hunter2', 'chap-secret', 'unused']), [
      'result.message',
      'result.call.params.1.device_config.chappassword',
    ])
  })

  it('checks keys too', () => {
    assert.deepEqual(findLeaks({ other_config: { 'hunter2-key': 'x' } }, ['hunter2']), ['other_config.hunter2-key'])
  })

  it('ignores empty secrets, which would match everything', () => {
    assert.deepEqual(findLeaks({ a: 'b' }, ['', undefined]), [])
  })

  it('finds nothing in redacted data', () => {
    const server = { host: '10.0.0.1', username: 'root', password: 'hunter2' }

    assert.deepEqual(findLeaks(redact(server), ['hunter2']), [])
  })
})
