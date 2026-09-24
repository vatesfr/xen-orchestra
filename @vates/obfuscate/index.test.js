'use strict'

const { describe, it } = require('node:test')
const assert = require('assert').strict

const { merge, obfuscate, OBFUSCATED_VALUE, replace } = require('./')

describe('replace()', () => {
  it('replaces the sensitive string params, recursively', () => {
    assert.deepEqual(
      replace(
        {
          host: 'example.org',
          password: 'secret',
          adminPassword: 'secret',
          passphrase: 'secret',
          token: 'secret',
          encryptionKey: 'secret',
          privateKey: 'secret',
          private_key: 'secret',
          sshPrivateKey: 'secret',
          nested: [{ privatekey: 'secret', username: 'root' }],
        },
        'X'
      ),
      {
        host: 'example.org',
        password: 'X',
        adminPassword: 'X',
        passphrase: 'X',
        token: 'X',
        encryptionKey: 'X',
        privateKey: 'X',
        private_key: 'X',
        sshPrivateKey: 'X',
        nested: [{ privatekey: 'X', username: 'root' }],
      }
    )
  })

  it('keeps non string values', () => {
    assert.deepEqual(replace({ password: null, privateKey: undefined, token: 42 }, 'X'), {
      password: null,
      privateKey: undefined,
      token: 42,
    })
  })
})

describe('obfuscate() and merge()', () => {
  it('merge() restores the obfuscated values', () => {
    const value = { username: 'root', privateKey: 'secret' }
    const obfuscated = obfuscate(value)
    assert.deepEqual(obfuscated, { username: 'root', privateKey: OBFUSCATED_VALUE })
    assert.deepEqual(merge({ ...obfuscated, username: 'admin' }, value), { username: 'admin', privateKey: 'secret' })
  })
})
