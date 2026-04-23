import assert from 'node:assert'
import { suite, test } from 'node:test'
import { AbstractEncryptor, ENCRYPTION_DESC_FILENAME, ENCRYPTION_METADATA_FILENAME } from './AbstractEncryptor.js'

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

suite('it should handle metadata', async () => {
  test('it should return none on empty remote ', async () => {
    const encryptor = new AbstractEncryptor(new MockFs())
    const { algorithm } = await encryptor.getAlgorithm()
    assert.strictEqual(algorithm, 'none')
  })
  test('it should read the agorithm if set ', async () => {
    const fs = new MockFs()
    fs.files[ENCRYPTION_DESC_FILENAME] = JSON.stringify({ algorithm: 'securealgorithm' })
    const encryptor = new AbstractEncryptor(fs)
    const { algorithm } = await encryptor.getAlgorithm()
    assert.strictEqual(algorithm, 'securealgorithm')
  })
  test('it should fail if no metadata file on encrypted  ', async () => {
    const fs = new MockFs()
    fs._remote.encryptionKey = 'mysecurekey'
    const encryptor = new AbstractEncryptor(fs)
    await assert.rejects(() => encryptor.getAlgorithm(), { code: 'ENOENT' })
  })
  test('it should fail if no metadata file on encrypted  ', async () => {
    const fs = new MockFs()
    fs._remote.encryptionKey = 'mysecurekey'
    const encryptor = new AbstractEncryptor(fs)
    await assert.rejects(() => encryptor.getAlgorithm(), { code: 'ENOENT' })
  })

  test('it should update the metadata files correctly', async () => {
    const fs = new MockFs()
    const encryptor = new AbstractEncryptor(fs)
    await encryptor.updateEncryptionMetadata('one GOOD key', 'secure algo')
    let content = JSON.parse(await fs._readFile(ENCRYPTION_DESC_FILENAME))

    assert.strictEqual(content.algorithm, 'secure algo')

    content = await fs._readFile(ENCRYPTION_METADATA_FILENAME)
  })
})
