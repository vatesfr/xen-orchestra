import { AbstractEncryptor } from "../../dist/encryptors/AbstractEncryptor.js";
import { RollingEncryptor } from "./RollingEncryptor.js";
import { SingleEncryptor } from "./SingleEncryptor.js";

export class FsEncryptor extends AbstractEncryptor{
    #handler
    #encryptor 
     
    constructor(handler){
        super(handler)
        this.#handler = handler
    }

    async init(){
        const {algorithm, updateMode } = await this.getAlgorithm()
        let encryptor
        switch(updateMode){
            case 'rolling':
                const currentEncryptor = new SingleEncryptor(this.#handler,algorithm)
                encryptor =  new RollingEncryptor(currentEncryptor)
                break
            case 'single':
                encryptor = new SingleEncryptor(this.#handler,algorithm) 
                break
            default: 
                throw new Error(`remote encryption mode ${mode} is not supported`)
        }
        await encryptor.init(algorithm)
        await encryptor.check(algorithm)
        this.#encryptor = encryptor
    }

    
    updateEncryptionKey(key, algorithm) {    
        return this.#encryptor.updateEncryptionKey(key , algorithm)
    }
    encryptBuffer(buffer){
        return this.#encryptor.encryptBuffer(buffer)
    }    
    decryptBuffer(buffer){
        return this.#encryptor.decryptBuffer(buffer)
    }    
    encryptStream(stream){
        return this.#encryptor.encryptStream(stream)
    }   
    decryptStream(stream){
        return this.#encryptor.decryptStream(stream)
    }

}