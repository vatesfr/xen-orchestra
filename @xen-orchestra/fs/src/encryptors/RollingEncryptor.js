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
   * @type {Map<number, SingleEncryptor}
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
    this.#currentEncryptorKey = encryptorsList.length + 1
    this.#encryptorCache.set(this.#currentEncryptorKey, this.#currentEncryptor) 
    await this.#instantiateEncryptor(1) // this will try to load the full chain of key
  }

  /**
   *
   * @param {number} encryptorIndex
   * @returns {Promise<SingleEncryptor>}
   */
  async #instantiateEncryptor(encryptorIndex) {
    assert.notEqual(this.#currentEncryptorKey, undefined, `Encryptor index must have been init`)
    assert.ok(encryptorIndex > 0, `Encryptor index must be over zero`)

    const encryptorInCache = this.#encryptorCache.get(encryptorIndex)
    if(encryptorInCache !== undefined){
      return Promise.resolve(encryptorInCache)
    }
    // ensure we don't have an infinite recursion
    assert.ok(encryptorIndex < this.#currentEncryptorKey, `Can't reinstantiate current encryptor ${encryptorIndex},  ${this.#currentEncryptorKey} `)
    
    
    // past encryptors are store one dis
    //  encrypted with the next more recent encryptor
    try {
      const indexStr = String(encryptorIndex).padStart(4, '0')
      const encryptedByIndex = encryptorIndex+1
      const  encryptedBy = await this.#instantiateEncryptor(encryptedByIndex)

      // read raw data
      const data = await this.handler._readFile(path.join(ENCRYPTOR_METADATA_BASEPATH, indexStr))
      const decrypted = encryptedBy.decryptBuffer(data).toString()
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
   * @returns {SingleEncryptor}
   */
  #getEncryptor(encryptorIndex) {
    let encryptor = this.#encryptorCache.get(encryptorIndex)
    if (encryptor === undefined) {
      throw new Error(`Encryptor index ${encryptorIndex} doe snot exists `)
    }

    return encryptor
  }

  /**
   * use the current encrypt to encrypt a buffer 
   * @param {Buffer} buffer
   * @returns {Buffer}
   */
  encryptBuffer(buffer) {
    if (typeof buffer === 'string') {
      buffer = Buffer.from(buffer)
    }
    const encryptor = this.#currentEncryptor
    const keyBuffer = Buffer.alloc(4)
    keyBuffer.writeUInt32BE(this.#currentEncryptorKey)
    return Buffer.concat([
      keyBuffer,
      encryptor.encryptBuffer(
        Buffer.concat([
          keyBuffer, // add keybuffer to encrypted data to ensure it is authenticated
          buffer,
        ])
      ),
    ])
  }
  /**
   * decrypt a buffer with the right encryptor  
   * 
   * @param {Buffer} buffer
   * @returns {Buffer}
   */
  decryptBuffer(buffer) {
    if (buffer.length < 4) {
      throw new Error(`Can't decrypt a buffer so small, size:${buffer.length}`)
    }
    const encryptorIndex = buffer.readUInt32BE(0)
    const encryptor = this.#getEncryptor(encryptorIndex)
    const decrypted = encryptor.decryptBuffer(buffer.slice(4))

    // check that the encryptor index has not been tampered with
    const authenticatedEncryptorIndex = decrypted.readUInt32BE(0)
    assert.strictEqual(authenticatedEncryptorIndex, encryptorIndex)
    return decrypted.slice(4)
  }

  /**
   * use the current encrypt to encrypt a stream 
   * @param {Readable}  stream
   * @returns {Readable}
   */
  encryptStream(stream) {
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
   * decrypt a stream with the right encryptor  
   * 
   * @param {Readable}  stream
   * @returns {Readable}
   */
  async decryptStream(stream) {
    /**
     * @type {Buffer}
     */
    const keyBuffer = await readChunkStrict(stream, 4)
    const encryptorIndex = keyBuffer.readUInt32BE(0)

    const encryptor = this.#getEncryptor(encryptorIndex)
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
    // can only update the key if the current one is ok
    await this.check() 

    const previousEncryptor = this.#currentEncryptor
    const encryptor = new SingleEncryptor(this.handler, algorithm, key)

    // same key and algorithm, no need to grow the key chain
    // compare from encryptors to ensure every key is a buffer 
    if(encryptor.key.equals(previousEncryptor.key) && encryptor.algorithm ===  previousEncryptor.algorithm){
        return 
    }

    // write the old encryptor data encrypted with the new encryptor
    const previousEncryptorIndex = pad(this.#currentEncryptorKey, 4) 
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
    // set the new encryptor as the current one
    this.#currentEncryptorKey++
    this.#encryptorCache.set(this.#currentEncryptorKey, encryptor)
    this.#currentEncryptor = encryptor

    await this.updateEncryptionMetadata()
  }

  async updateEncryptionMetadata(){
    const algorithm = this.#currentEncryptor.algorithm
    super.updateEncryptionMetadata(algorithm)
  }
}
