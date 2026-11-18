'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const { obfuscate, OBFUSCATED_VALUE, redact, redactUrls } = require('./')

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

  it('accepts a custom predicate and replacement', () => {
    assert.deepEqual(
      redact({ a: 1, b: { a: 2, c: 3 } }, key => key === 'a', { replacement: '*' }),
      {
        a: '*',
        b: { a: '*', c: 3 },
      }
    )
  })

  it('redacts the URLs of the other strings with `urls`', () => {
    const data = {
      params: { url: 'smb://admin:p@ss@nas\\\\share' },
      error: 'mount of nfs://user:pass@host/path failed',
    }

    assert.deepEqual(redact(data, undefined, { replacement: '*', urls: true }), {
      params: { url: 'smb://*@nas\\\\share' },
      error: 'mount of nfs://*@host/path failed',
    })
    assert.deepEqual(redact(data), data)
  })

  it('returns other values as is', () => {
    assert.equal(redact('password'), 'password')
    assert.equal(redact(null), null)
  })
})

describe('redactUrls()', () => {
  it('replaces the credentials of URLs, anywhere in the string', () => {
    assert.equal(
      redactUrls('failed to connect to https://user:p%40ss@host/ and s3://KEY:secret@s3.lan/bucket'),
      `failed to connect to https://${OBFUSCATED_VALUE}@host/ and s3://${OBFUSCATED_VALUE}@s3.lan/bucket`
    )
  })

  it('replaces the credentials of SMB URLs up to the last @ before the path', () => {
    assert.equal(redactUrls('smb://user:p@ss/w@domain\\\\host\0path', '*'), 'smb://*@domain\\\\host\0path')
  })

  it('replaces sensitive query parameters', () => {
    assert.equal(
      redactUrls('s3://host/bucket?encryptionKey=k&region=eu&adminPassword=p', '*'),
      's3://host/bucket?encryptionKey=*&region=eu&adminPassword=*'
    )
  })

  it('handles replacements containing $', () => {
    assert.equal(redactUrls('http://u:p@h/', '$1'), 'http://$1@h/')
  })

  it('returns strings without URLs as is', () => {
    assert.equal(redactUrls('user:pass@host'), 'user:pass@host')
  })
})
