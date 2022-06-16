'use strict'

const crypto = require('crypto')
const { _getEncryptor: getEncryptor } = require('./_encryptors')

/* eslint-env jest */

test('can encrypt and decryp AES 256', async () => {
  const { encrypt, decrypt } = getEncryptor(
    JSON.stringify({
      algorithm: 'aes-256-cbc',
      key: crypto.randomBytes(32),
      ivLength: 16,
    })
  )

  const buffer = crypto.randomBytes(1024)

  const encrypted = encrypt(buffer)
  const decrypted = decrypt(encrypted)
  expect(buffer.equals(decrypted)).toEqual(true)
})
