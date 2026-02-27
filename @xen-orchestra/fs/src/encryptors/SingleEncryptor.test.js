import assert from 'node:assert'
import { suite, test } from 'node:test'
import { Readable } from 'node:stream'
import { SingleEncryptor } from './SingleEncryptor'

class MockFs {
  files = {}
  _remote = {
    encryptionKey: undefined,
  }
  async _readFile(path) {
    if (!this.files[path]) {
      const error = new Error('Not here')
      error.code = 'ENOENT'
      throw error
    }
    return Promise.resolve(Buffer.from(this.files[path]))
  }
  async _writeFile(path, buffer) {
    this.files[path] = buffer
    return Promise.resolve()
  }
  async __writeFile(path, buffer) {
    this.files[path] = 'encrypted' + buffer
    return Promise.resolve()
  }
}

suite('no encryption', async () => {
  test('it should not modify buffer on encrypt ',  () => {
    const encryptor = new SingleEncryptor(new MockFs(), 'none')
    const buffer = Buffer.from('MY SOURCE')
    const encrypted = encryptor.encryptBuffer(buffer)
    assert.ok(buffer.equals(encrypted))
  })
  test('it should not modify buffer on decrypt ',  () => {
    const encryptor = new SingleEncryptor(new MockFs(), 'none')
    const buffer = Buffer.from('MY SOURCE')
    const encrypted = encryptor.decryptBuffer(buffer)
    assert.ok(buffer.equals(encrypted))
  })
})

suite('it can encrypt', async () => {
  test('it encrypts and decrypt a buffer', () => {
    const encryptor = new SingleEncryptor(new MockFs(), 'aes-256-gcm', '0123456789ABCDEF0123456789ABCDEF')
    const buffer = Buffer.from('MY SOURCE')
    const encrypted = encryptor.encryptBuffer(buffer)
    const decrypted = encryptor.decryptBuffer(encrypted)
    assert.ok(buffer.equals(decrypted))
    assert.ok(!buffer.equals(encrypted))
  })

  test('it encrypts and decrypt a stream', async () => {
    const encryptor = new SingleEncryptor(new MockFs(), 'aes-256-gcm', '0123456789ABCDEF0123456789ABCDEF')
    let sourceBuffer = Buffer.alloc(0)
    function* generator() {
      for (let i = 0; i < 10; i++) {
        const buffer = Buffer.alloc(1024, i)
        sourceBuffer = Buffer.concat([sourceBuffer, buffer])
        yield buffer
      }
    }
    const stream = Readable.from(generator(), { objectMode: false })

    const encrypted = encryptor.encryptStream(stream)
    let result = Buffer.alloc(0)
    const decrypted = encryptor.decryptStream(encrypted)

    for await (const buffer of decrypted) {
      result = Buffer.concat([result, buffer])
    }
  })

  test('it authenticate  a buffer',  () => {
    const encryptor = new SingleEncryptor(new MockFs(), 'aes-256-gcm', '0123456789ABCDEF0123456789ABCDEF')
    const buffer = Buffer.allocUnsafe(1024 * 1024)
    const encrypted = encryptor.encryptBuffer(buffer)
    encrypted.writeUInt8(2, 7) // modify a byte

    assert.throws(() => encryptor.decryptBuffer(encrypted))
  })


  test('it authenticate  a buffer',  () => {
    const encryptor = new SingleEncryptor(new MockFs(), 'aes-256-gcm', '0123456789ABCDEF0123456789ABCDEF')
    const buffer = Buffer.allocUnsafe(1024 * 1024)
    const encrypted =  encryptor.encryptBuffer(buffer)
    encrypted.writeUInt8(2, 7) // modify a byte

    assert.throws(() => encryptor.decryptBuffer(encrypted))
  })
})
