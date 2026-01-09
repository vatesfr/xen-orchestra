import assert from 'node:assert'
import { suite, test } from 'node:test'
import { SingleEncryptor } from './SingleEncryptor.js'
import { RollingEncryptor } from './RollingEncryptor.js'

class MockFs {
  files = {}
  encryptor
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
  async __readFile(path) {
    const data = await this._readFile(path)
    return (await this.encryptor?.decryptBuffer(data)) ?? data
  }
  async _writeFile(path, buffer) {
    this.files[path] = buffer
    return Promise.resolve()
  }
  async __writeFile(path, buffer) {
    const encrypted = (await this.encryptor?.encryptBuffer(buffer)) ?? buffer
    return this._writeFile(path, encrypted)
  }
  async list(dir) {
    return Promise.resolve(
      Object.keys(this.files)
        .filter(file => file.startsWith(dir))
        .map(file => file.substring(dir.length))
    )
  }
}
/*
suite('it works with one key ', async()=>{
    test('encryption and decryption', async ()=>{
        const fs = new MockFs()
        const encryptor = new SingleEncryptor(fs, 'aes-256-gcm', '0123456789ABCDEF0123456789ABCDEF')
        const rolling = new RollingEncryptor(encryptor)
        await rolling.init()

        const buffer = Buffer.from(" GOT IT GUY")
        const encrypted = await rolling.encryptBuffer(buffer)
        const decrypted = await rolling.decryptBuffer(encrypted)
        assert.ok(decrypted.equals(buffer))
    })
})
*/
suite('it works with updated  keys ', async () => {
  /*
    test('mock works with buffer', async ()=>{
        const fs = new MockFs()
        const encryptor = new SingleEncryptor(fs, 'aes-256-gcm', '0123456789ABCDEF0123456789ABCDEF')
        const rolling = new RollingEncryptor(encryptor)
        fs.encryptor = rolling
        await rolling.init()

        const buffer = Buffer.from(" GOT IT GUY")
        await fs.__writeFile("encrytpion1", buffer)
        const encrypted = await fs._readFile("encrytpion1") 
        const decrypted = await fs.__readFile("encrytpion1") 
        assert.ok(decrypted.equals(buffer))
        assert.ok(!decrypted.equals(encrypted))
    })
*/

  test('works with buffer ', async () => {
    const fs = new MockFs()
    const encryptor = new SingleEncryptor(fs, 'aes-256-gcm', '0123456789ABCDEF0123456789ABCDEF')
    const rolling = new RollingEncryptor(encryptor)
    fs.encryptor = rolling
    await rolling.init()

    const content = Buffer.from(' GOT IT GUY')
    await fs.__writeFile('encrytpion1', content)

    await rolling.updateEncryptionKey('023456789ABCDEF0123456789ABCDEF1', 'chacha20-poly1305')

    await fs.__writeFile('encrytpion2', content)

    const encrypted1 = await fs._readFile('encrytpion1')
    assert.ok(!content.equals(encrypted1))
    const decrypted1 = await fs.__readFile('encrytpion1')
    assert.ok(content.equals(decrypted1))

    const encrypted2 = await fs._readFile('encrytpion2')
    assert.ok(!content.equals(encrypted2))
    assert.ok(!encrypted1.equals(encrypted2))
    const decrypted2 = await fs.__readFile('encrytpion2')
    assert.ok(content.equals(decrypted2))

    assert.equal((await fs.list('encryptors')).length, 1)

    await rolling.updateEncryptionKey('023456789ABCDEF0123456789ABCDEF3', 'chacha20-poly1305')
    await fs.__writeFile('encrytpion3', content)

    const encrypted3 = await fs._readFile('encrytpion3')
    assert.ok(!content.equals(encrypted3))
    assert.ok(!encrypted1.equals(encrypted3))
    const decrypted3 = await fs.__readFile('encrytpion3')
    assert.ok(content.equals(decrypted3))

    assert.equal((await fs.list('encryptors')).length, 2)
  })
})
