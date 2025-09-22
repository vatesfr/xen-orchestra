import { AbstractEncryptor } from "./AbstractEncryptor.js";
import crypto from 'node:crypto'
import { pipeline } from "node:stream"
import { readChunkStrict } from "@vates/read-chunk";

const CHACHA20 = 'chacha20-poly1305'
const AES256 = 'aes-256-gcm'
export class SingleEncryptor extends AbstractEncryptor {

    /**
     * @type {number}
     */
    #ivLength
    /**
     * @type {number}
     */
    #authTagLength

    #algorithm
    get algorithm(){
        return this.#algorithm
    }
    #key
    get key(){
        return this.#key
    }
    #handler
    get handler(){
        return this.#handler
    }

    constructor(handler, algorithm, key){
        super(handler)
        this.#handler = handler
        this.#key = key  ?? handler._remote.encryptionKey
        if(!this.#key){
            this.#algorithm = 'none'
            return 
        } else {
            this.#algorithm = algorithm
        }
        const info = crypto.getCipherInfo(algorithm, { keyLength: key.length })
        if (info === undefined) {
            const error = new Error(
                `Either the algorithm ${algorithm} is not available, or the key length ${
                key.length
                } is incorrect. Supported algorithm are ${crypto.getCiphers()}`
            )
            error.code = 'BAD_ALGORITHM'
            throw error
        }
        const { ivLength, mode } = info
        this.#ivLength = ivLength
        const authTagLength = ['gcm', 'ccm', 'ocb'].includes(mode) || algorithm === CHACHA20 ? 16 : 0
        this.#authTagLength = authTagLength
    }

    /**
     * 
     * @param {Buffer} buffer 
     * @returns {Promise<Buffer>}
     */
    async encryptBuffer(buffer) {
        if(this.#algorithm === 'none'){
            return Promise.resolve(buffer)
        }
        const iv = crypto.randomBytes(this.#ivLength)
        const cipher = crypto.createCipheriv(this.#algorithm, Buffer.from(this.#key), iv)
        const encrypted = cipher.update(buffer)
        return Buffer.concat([iv, encrypted, cipher.final(), this.#authTagLength > 0 ? cipher.getAuthTag() : Buffer.alloc(0)])

    }
    /**
     * 
     * @param {Buffer} buffer 
     * @returns {Promise<Buffer>}
     */
    async decryptBuffer(buffer) {
        if(this.#algorithm === 'none'){
            return Promise.resolve(buffer)
        }
        const iv = buffer.slice(0, this.#ivLength)
        const decipher = crypto.createDecipheriv(this.#algorithm, Buffer.from(this.#key), iv)
        let encrypted
        if (this.#authTagLength > 0) {
            const authTag = buffer.slice(buffer.length - this.#authTagLength)
            decipher.setAuthTag(authTag)
            encrypted = buffer.slice(this.#ivLength, buffer.length - this.#authTagLength)
        } else {
            encrypted = buffer.slice(this.#ivLength)
        }
        const decrypted = decipher.update(encrypted)
        return Buffer.concat([decrypted, decipher.final()])
    }


    async encryptStream(input) {
        if(this.#algorithm === 'none'){
            return Promise.resolve(input)
        }
        const self = this
        return pipeline(
            input,
            async function* (source) {
                const iv = crypto.randomBytes(self.#ivLength)
                const cipher = crypto.createCipheriv(self.#algorithm, Buffer.from(self.#key), iv)
                yield iv
                for await (const data of source) {
                    yield cipher.update(data)
                }
                yield cipher.final()
                // must write the auth tag at the end of the encryption stream
                if (self.#authTagLength > 0) {
                    yield cipher.getAuthTag()
                }
            },
            () => { }
        )
    }


    async decryptStream(encryptedStream) {
        if(this.#algorithm === 'none'){
            return Promise.resolve(encryptedStream)
        }
        const self = this
        return pipeline(
            encryptedStream,
            async function* (source) {
                /**
                 * WARNING
                 *
                 * the crypted size has an initializtion vector + eventually an auth tag + a padding at the end
                 * whe can't predict the decrypted size from the start of the encrypted size
                 * thus, we can't set decrypted.length reliably
                 *
                 */

                const iv = await readChunkStrict(source, self.#ivLength)
                const cipher = crypto.createDecipheriv(self.#algorithm, Buffer.from(self.#key), iv)
                let authTag = Buffer.alloc(0)
                for await (const data of source) {
                    if (data.length >= self.#authTagLength) {
                        // fast path, no buffer concat
                        yield cipher.update(authTag)
                        authTag = data.slice(data.length - self.#authTagLength)
                        yield cipher.update(data.slice(0, data.length - self.#authTagLength))
                    } else {
                        // slower since there is a concat
                        const fullData = Buffer.concat([authTag, data])
                        const fullDataLength = fullData.length
                        if (fullDataLength > self.#authTagLength) {
                            authTag = fullData.slice(fullDataLength - self.#authTagLength)
                            yield cipher.update(fullData.slice(0, fullDataLength - self.#authTagLength))
                        } else {
                            authTag = fullData
                        }
                    }
                }
                if (self.#authTagLength > 0) {
                    cipher.setAuthTag(authTag)
                }
                yield cipher.final()
            },
            () => { }
        )
    }

    #isFsEmpty(){

    }
   async updateEncryption(key, algorithm = AbstractEncryptor.DEFAULT_ENCRYPTION_ALGORITHM){
        if(!await this.#isFsEmpty()){
            throw new Error(`Can't update the encryption of a non empty remote`)
        } 
        this.#algorithm = algorithm
        this.#key = key
        this.updateEncryptionMetadata( algorithm, 'single')
    }

}