import assert from 'node:assert'
import path from 'node:path'
import { readChunkStrict } from "@vates/read-chunk";
import { AbstractEncryptor } from "./AbstractEncryptor.js";
import { SingleEncryptor } from "./SingleEncryptor.js";

const ENCRYPTOR_METADATA_BASEPATH = 'encryptors'

function pad(source, length){
    let res = new String(source)
    while(res.length < length){
        res = '0'+res
    }
    return res
}
export class RollingEncryptor extends AbstractEncryptor{
    get handler(){
        return this.#currentEncryptor.handler
    }
    /**
     * @type {Map<number, SingleEncryptor | Promise<SingleEncryptor>}
     */
    #encryptorCache = new Map()
    /**
     * @type {number?}
     */
    #currentEncryptorKey 

    #currentEncryptor

    /**
     * the current encryptor is the key to unlock recursively the full chain
     * @param handler
     * @param {SingleEncryptor?} currentEncryptor 
     */
    constructor( currentEncryptor){
        super(currentEncryptor.handler)
        this.#currentEncryptor = currentEncryptor
    }

    async init(){
        const encryptorsList = (await this.handler.list(ENCRYPTOR_METADATA_BASEPATH))
            .filter(name => name.match(/[0-9]{4}/))
            .map(name => parseInt(name, 10))
        if(encryptorsList.length > 0 ){
            encryptorsList.sort()
        }
        if(this.#currentEncryptor){
            this.#encryptorCache.set(this.#encryptorCache.size , this.#currentEncryptor)
        }
        this.#currentEncryptorKey = this.#encryptorCache.size - 1 
        
    }

    async #instantiateEncryptor(encryptorIndex){
        assert.ok(encryptorIndex >0, `Encryptor index must be over zero`)
        assert.ok(encryptorIndex < this.#currentEncryptorKey , `Can't reinstantaite current encryptor`)
        try {
            const indexStr = new String(encryptorIndex).padStart(4, '0')
            const encryptedBy = await this.#getEncryptor(encryptorIndex +1)
            // read raw data 
            const data = await this.handler._readFile(path.join(ENCRYPTOR_METADATA_BASEPATH, indexStr))
            const decrypted = await encryptedBy.decryptBuffer(data) 
            const {algorithm, key} = JSON.parse(decrypted)
            const encryptor = new SingleEncryptor(this.handler, algorithm, key)
            return encryptor    

        }catch(error){
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
    #getEncryptor(encryptorIndex){
        if(this.#encryptorCache.has(encryptorIndex)){
            return Promise.resolve(this.#encryptorCache.get(encryptorIndex))
        }
        this.#encryptorCache.set(encryptorIndex, this.#instantiateEncryptor(encryptorIndex))
    }
    
    /**
     * 
     * @param {Buffer} buffer 
     * @returns {Promise<Buffer>}
     */
    async encryptBuffer(buffer){
        if(typeof buffer  === 'string'){
            buffer = Buffer.from(buffer)
        }
        const encryptor = this.#encryptorCache.get(this.#currentEncryptorKey)
        const keyBuffer = Buffer.alloc(4)
        keyBuffer.writeUInt32BE(this.#currentEncryptorKey)
        return Buffer.concat([
            keyBuffer,
            await encryptor.encryptBuffer(Buffer.concat([
                keyBuffer,  // add keybuffer to encrypted data to ensure it is authenticated
                buffer
            ]))
        ])
    }
    /**
     * 
     * @param {Buffer} buffer 
     * @returns {Promise<Buffer>}
     */
    async decryptBuffer(buffer){
        if(buffer.length < 4){
            throw new Error(`Can't decrypt a buffer so small, size:${buffer.length}`)
        }
        const encryptorIndex = buffer.readUInt32BE(0)
        const encryptor = this.#encryptorCache.get(encryptorIndex)
        const decrypted = await encryptor.decryptBuffer(buffer.slice(4))

        // check tha the encryptor index has not been tampered with 
        const authenticatedEncryptorIndex = decrypted.readUInt32BE(0)
        assert.strictEqual(authenticatedEncryptorIndex, encryptorIndex)
        return decrypted.slice(4)
    }


    async * encryptStream(stream){
        const keyBuffer = Buffer.alloc(4)
        keyBuffer.writeUInt32BE(this.#currentEncryptorKey)
        yield keyBuffer

        const encryptor = this.currentEncryptor

        let encryptedStream = encryptor.encryptStream(stream)
        for await (const data of encryptedStream){
            yield data
        }
    }


    async *decryptStream(stream){
        const keyBuffer = await readChunkStrict(stream, 4)
        const encryptorIndex = keyBuffer.readUInt32BE(0)

        const encryptor = this.#getEncryptor(encryptorIndex)
        const decryptedStream = encryptor.decryptStream(stream)
        const authenticatedKeyBuffer = await readChunkStrict(decryptedStream, 4)
        const authenticatedEncryptorIndex = authenticatedKeyBuffer.readUInt32BE(0)
        
        assert.strictEqual(authenticatedEncryptorIndex, encryptorIndex)
        
        for await (const data of decryptedStream){
            yield data
        }
    }

    /**
     * add a new encryptor to the chain
     * the previous encryptor is saved, encrypted by the new key
     * 
     * @param {Buffer} key 
     * @param {string} algorithm 
     * @returns {Promise<>}
     */
    async updateEncryptionKey(key, algorithm = AbstractEncryptor.DEFAULT_ENCRYPTION_ALGORITHM){
        const previousEncryptor = this.#currentEncryptor
        const previousEncryptorIndex = pad(this.#currentEncryptorKey,4)
        const encryptor = new SingleEncryptor(this.handler, algorithm, key)
        this.#currentEncryptorKey ++
        this.#encryptorCache.set(this.#currentEncryptorKey, encryptor)
        await this.handler.__writeFile(
            path.join(ENCRYPTOR_METADATA_BASEPATH, previousEncryptorIndex), 
            Buffer.from(JSON.stringify({
                algorithm: previousEncryptor.algorithm,
                key: previousEncryptor.key, 
                updated_at: Date.now()
            }))
        )
        await this.updateEncryptionMetadata(algorithm, 'rolling')

    }
}