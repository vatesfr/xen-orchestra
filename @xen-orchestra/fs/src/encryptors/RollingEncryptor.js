// @ts-check
import assert from 'node:assert'
import path from 'node:path'
import { readChunkStrict } from '@vates/read-chunk'
import { AbstractEncryptor, DEFAULT_ENCRYPTION_ALGORITHM } from './AbstractEncryptor.js'
import { SingleEncryptor } from './SingleEncryptor.js'
import { Readable } from 'node:stream'

const ENCRYPTOR_METADATA_BASEPATH = 'encryptors'

/**
 *
 * @param {any} source
 * @param {number} length
 * @returns {string}
 */
function pad(source, length) {
  let res = String(source)
  while (res.length < length) {
    res = '0' + res
  }
  return res
}
export class RollingEncryptor extends AbstractEncryptor {
  get handler() {
    return this.#currentEncryptor.handler
  }
  /**
   * @type {Map<number, SingleEncryptor | Promise<SingleEncryptor>}
   */
  #encryptorCache = new Map()
  /**
   * @type {number|undefined}
   */
  #currentEncryptorKey

  #currentEncryptor

  /**
   * the current encryptor is the key to unlock recursively the full chain
   * @param handler
   * @param {SingleEncryptor} currentEncryptor
   */
  constructor(currentEncryptor) {
    super(currentEncryptor.handler)
    this.#currentEncryptor = currentEncryptor
  }

  /**
   * @returns {Promise<void>}
   */
  async init() {
    await super.init()
    const encryptorsList = (await this.handler.list(ENCRYPTOR_METADATA_BASEPATH))
      .filter(name => name.match(/[0-9]{4}/))
      .map(name => parseInt(name, 10))
    if (encryptorsList.length > 0) {
      encryptorsList.sort()
    }
    if (this.#currentEncryptor) {
      this.#encryptorCache.set(this.#encryptorCache.size, this.#currentEncryptor)
    }
    this.#currentEncryptorKey = this.#encryptorCache.size - 1
  }

  /**
   *
   * @param {number} encryptorIndex
   * @returns {Promise<SingleEncryptor>}
   */
  async #instantiateEncryptor(encryptorIndex) {
    assert.notEqual(this.#currentEncryptorKey, undefined, `Encryptor index must have been init`)
    assert.ok(encryptorIndex > 0, `Encryptor index must be over zero`)
    assert.ok(encryptorIndex < this.#currentEncryptorKey, `Can't reinstantaite current encryptor`)
    try {
      const indexStr = String(encryptorIndex).padStart(4, '0')
      const encryptedBy = await this.#getEncryptor(encryptorIndex + 1)
      // read raw data
      const data = await this.handler._readFile(path.join(ENCRYPTOR_METADATA_BASEPATH, indexStr))
      const decrypted = (await encryptedBy.decryptBuffer(data)).toString()
      const { algorithm, key } = JSON.parse(decrypted)
      const encryptor = new SingleEncryptor(this.handler, algorithm, key)
      return encryptor
    } catch (error) {
      const visibleError = new Error(`Can't instantiate key ${encryptorIndex}`)
      visibleError.cause = error
      throw visibleError
    }
  }

  /**
   *
   * @param {number} encryptorIndex
   * @returns {Promise<SingleEncryptor>}
   */
  async #getEncryptor(encryptorIndex) {
    let encryptor = this.#encryptorCache.get(encryptorIndex)
    if (encryptor === undefined) {
      encryptor = this.#instantiateEncryptor(encryptorIndex)
      this.#encryptorCache.set(encryptorIndex, encryptor)
    }

    return await encryptor
  }

  /**
   *
   * @param {Buffer} buffer
   * @returns {Promise<Buffer>}
   */
  async encryptBuffer(buffer) {
    if (typeof buffer === 'string') {
      buffer = Buffer.from(buffer)
    }
    const encryptor = await this.#getEncryptor(this.#currentEncryptorKey)
    const keyBuffer = Buffer.alloc(4)
    keyBuffer.writeUInt32BE(this.#currentEncryptorKey)
    return Buffer.concat([
      keyBuffer,
      await encryptor.encryptBuffer(
        Buffer.concat([
          keyBuffer, // add keybuffer to encrypted data to ensure it is authenticated
          buffer,
        ])
      ),
    ])
  }
  /**
   *
   * @param {Buffer} buffer
   * @returns {Promise<Buffer>}
   */
  async decryptBuffer(buffer) {
    if (buffer.length < 4) {
      throw new Error(`Can't decrypt a buffer so small, size:${buffer.length}`)
    }
    const encryptorIndex = buffer.readUInt32BE(0)
    const encryptor = await this.#getEncryptor(encryptorIndex)
    const decrypted = await encryptor.decryptBuffer(buffer.slice(4))

    // check tha the encryptor index has not been tampered with
    const authenticatedEncryptorIndex = decrypted.readUInt32BE(0)
    assert.strictEqual(authenticatedEncryptorIndex, encryptorIndex)
    return decrypted.slice(4)
  }

  /**
   * @param {Readable}  stream
   * @returns {Promise<Readable>}
   */
  async encryptStream(stream) {
    const keyBuffer = Buffer.alloc(4)
    keyBuffer.writeUInt32BE(this.#currentEncryptorKey)

    const encryptor = this.currentEncryptor

    async function* generator() {
      yield keyBuffer
      for await (const data of encryptor.encryptStream(stream)) {
        yield data
      }
    }

    return Readable.from(generator(), { objectMode: false, highWaterMark: 10 * 1024 * 1024 })
  }

  /**
   * @param {Readable}  stream
   * @returns {Promise<Readable>}
   */
  async decryptStream(stream) {
    /**
     * @type {Buffer}
     */
    const keyBuffer = await readChunkStrict(stream, 4)
    const encryptorIndex = keyBuffer.readUInt32BE(0)

    const encryptor = await this.#getEncryptor(encryptorIndex)
    const decryptedStream = await encryptor.decryptStream(stream)
    /**
     * @type {Buffer}
     */
    const authenticatedKeyBuffer = await readChunkStrict(decryptedStream, 4)
    const authenticatedEncryptorIndex = authenticatedKeyBuffer.readUInt32BE(0)

    assert.strictEqual(authenticatedEncryptorIndex, encryptorIndex)

    async function* generator() {
      for await (const data of decryptedStream) {
        yield data
      }
    }
    return Readable.from(generator(), { objectMode: false, highWaterMark: 10 * 1024 * 1024 })
  }

  /**
   * add a new encryptor to the chain
   * the previous encryptor is saved, encrypted by the new key
   *
   * @param {Buffer} key
   * @param {string} algorithm
   * @returns {Promise<void>}
   */
  async updateEncryptionKey(key, algorithm = DEFAULT_ENCRYPTION_ALGORITHM) {
    const previousEncryptor = this.#currentEncryptor
    const previousEncryptorIndex = pad(this.#currentEncryptorKey, 4)
    const encryptor = new SingleEncryptor(this.handler, algorithm, key)
    this.#currentEncryptorKey++
    this.#encryptorCache.set(this.#currentEncryptorKey, encryptor)
    await this.handler.__writeFile(
      path.join(ENCRYPTOR_METADATA_BASEPATH, previousEncryptorIndex),
      Buffer.from(
        JSON.stringify({
          algorithm: previousEncryptor.algorithm,
          key: previousEncryptor.key,
          updated_at: Date.now(),
        })
      )
    )
    await super.updateEncryptionKey(key, algorithm)
  }
}
