import { describe, it } from 'node:test'
import { strict as assert } from 'assert'

import { Readable } from 'node:stream'
import { _getEncryptor } from './_encryptor'
import crypto from 'crypto'

const algorithms = ['none', 'aes-256-cbc', 'aes-256-gcm']

function streamToBuffer(stream) {
  return new Promise(resolve => {
    const bufs = []
    stream.on('data', function (d) {
      bufs.push(d)
    })
    stream.on('end', function () {
      resolve(Buffer.concat(bufs))
    })
  })
}

algorithms.forEach(algorithm => {
  describe(`test algorithm ${algorithm}`, () => {
    const key = algorithm === 'none' ? undefined : '73c1838d7d8a6088ca2317fb5f29cd91'
    const encryptor = _getEncryptor(algorithm, key)
    const buffer = crypto.randomBytes(1024 * 1024 + 1)
    it('handle buffer', () => {
      const encrypted = encryptor.encryptData(buffer)
      if (algorithm !== 'none') {
        assert.equal(encrypted.equals(buffer), false) // encrypted should be different
        // ivlength, auth tag, padding
        assert.notEqual(encrypted.length, buffer.length)
      }

      const decrypted = encryptor.decryptData(encrypted)
      assert.equal(decrypted.equals(buffer), true)
    })

    it('handle an array of buffers', () => {
      // like a VHD block: a bitmap then the data, sizes not aligned on the cipher block size
      const parts = [crypto.randomBytes(512), crypto.randomBytes(1024 * 1024 + 1)]
      const encrypted = Buffer.concat(encryptor.encryptDataParts(parts))

      // same layout as a single buffer: existing remotes must still be readable
      const decrypted = encryptor.decryptData(encrypted)
      assert.equal(decrypted.equals(Buffer.concat(parts)), true)
    })

    it('handle stream', async () => {
      const stream = Readable.from(buffer)
      stream.length = buffer.length
      const encrypted = encryptor.encryptStream(stream)
      if (algorithm !== 'none') {
        assert.equal(encrypted.length, undefined)
      }

      const decrypted = encryptor.decryptStream(encrypted)
      const decryptedBuffer = await streamToBuffer(decrypted)
      assert.equal(decryptedBuffer.equals(buffer), true)
    })
  })
})
