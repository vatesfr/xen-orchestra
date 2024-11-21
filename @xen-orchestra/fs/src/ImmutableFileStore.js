

import fsx from 'fs-extended-attributes'
import { createHash, randomBytes } from 'node:crypto'
import assert from 'node:assert'
import path, { dirname } from 'node:path'
import { fromCallback, ignoreErrors } from 'promise-toolbox'



function getExtendedAttribute(path, attributeName) {
    return new Promise((resolve, reject) => {
      fsx.get(path, attributeName, (err, res) => {
        if (err) {
            console.log({path, attributeName
            })
          reject(err)
        } else {
          // res is a buffer
          // it is null if the file doesn't have this attribute
          if (res !== null) {
            resolve(res.toString('utf-8'))
          } else {
            resolve(undefined)
          }
        }
      })
    })
  }

function setExtendedAttribute(path, attributeName, value) {
    return new Promise((resolve, reject) => {
      fsx.set(path, attributeName, value, (err, res) => {
        if (err) {
            console.error('setExtendedAttribute err ', path, attributeName)
            console.log(err)
          reject(err)
        } else {
            console.log('setExtendedAttribute succeed')
          resolve(res)
        }
      })
    })
  }



const STORE_DIRECTORY = '/xo-block-storage/'
/**
 * store huge number of small fies, with various strategies
 * depending on the remote capabilities
 * 
 */
export class AbstractImmutableFileStore{

    async read(id){ 
        throw new Error('read is not implemented')
    }

    async write(id, content){
        throw new Error('write is not implemented')

    }

    async remove(id){
        throw new Error('remove is not implemented')

    }

    async move(from, to){
        throw new Error('move is not implemented')

    }
    async init(){
        throw new Error('move is not implemented')
    }

}

/**
 * basic, File are stored in place , never modified
 */
export class RemoteImmutableFileStore extends AbstractImmutableFileStore{
    #handler
    get handler(){
        return this.#handler
    }
    constructor(handler){
        super()
        this.#handler = handler
    }
    async read(path){
        return this.handler.readFile(path)
    }

    async write(path, content, opts){
        await this.handler.outputFile(path, content, opts)
    }

    async remove(path){
        return this.handler.unlink(path)
    }

    async move(from, to){
        return this.handler.rename(from , to)
    }

    async vacuum(){}
    async init(){}
}

export class AbstractDeduplicatedFileStore extends RemoteImmutableFileStore{
    #watchedPath = /xo-vm-backups\/[^/]+\/vdis\/[^/]+\/[^/]+\/data\/[^/]+\.vhd\/blocks/
    #dedupDirectory
    #hashMethod = 'sha256'

    get hashMethod(){
        return this.#hashMethod
    }
    constructor(handler, dedupDirectory = STORE_DIRECTORY){
        super(handler)
        this.#dedupDirectory = dedupDirectory
    }

    #computeHash(data){
        return createHash(this.hashMethod).update(data).digest('hex')
    }

    // split path to keep a sane number of file per directory
    // at most each entry dir will contains 65536 entries
    #computeDeduplicationPath(hash) {
        assert.equal(hash.length % 4, 0)
        let pathParts = [this.#dedupDirectory]
        for (let i = 0; i < hash.length/4; i++) {
            pathParts.push(hash.substring(4*i, 4*(i+1)))
        }
        return path.join(...pathParts)
    }

    async #releaseUnsedFromStore(hash){
        const dedupPath = this.#computeDeduplicationPath(hash)
        try{
            const { nlink, size } = await this.handler.stat(dedupPath)
            if (nlink === 1) {
                await this.handler.unlink(dedupPath)
                return {reclaimedSize: size}
            }
        }catch(err) {
            // already released by a concurrent process
            if(err.code !== 'ENOENT'){
                throw err
            }
        }
    }


    async write(path, content, opts){
        if(!this.#watchedPath.test(path)){
            return super.write(path,content, opts)
        }

        // compute hash
        const hash = this.#computeHash(content)
        const dedupPath = this.#computeDeduplicationPath(hash)
        try{
            await super.write(dedupPath, 
                content,  {...opts, flags: 'wx'}) 
        }catch(err){
            
            if(err.code !== 'EEXIST'){
                // a concurrent process created this file
                throw err
            }
        } 
        // add extended attribute
        await this._saveHash(dedupPath, hash)


        await this.handler.link( dedupPath, path)

        
    }

    async remove(path){
        if(!this.#watchedPath.test(path)){
            return super.remove(path)
        }
        const hash = await this._retrieveHash(path)
        await super.remove(path)
        if(hash !== undefined){
            await this.#releaseUnsedFromStore(hash)
        }
    }

    async move(from, to){
        // @todo handle case where only one of both from/to is watched
        if(!this.#watchedPath.test(from) ){
            return super.move(from,to)
        }
        
        let hash
        try{
            hash = await this._retrieveHash(to)
        }catch(err){ 
        }
        await super.move(from,to)
        if(hash !== undefined){
            await this.#releaseUnsedFromStore(hash)
        }
    }

    // since we have a hash , add a little sanity check
    async read(path){
        const content = await super.read(path)
        const contentHash = this.#computeHash(content)
        // can be empty when enabling dedup on a remote with data   
        const fileHash = this._retrieveHash(path)
        
        if(fileHash !== undefined){
            assert.strictEqual(contentHash, fileHash, `the hash of the file ${path} doesn't match its content (content : ${contentHash}, attr: ${fileHash})`)
        }
        return content
    }


    async init(){
        console.log('init')
        const supported = await checkSupport(this.handler)
        assert.strictEqual(supported.hardLink, true, 'remote must support hard links')
        await super.init()
        await this.handler.outputFile(
            path.join(this.#dedupDirectory, 'settings.json'), 
            JSON.stringify(this._getSettings()),
            {flags: 'wx'})
        console.log('AbstractDeduplicatedFileStore init done',  path.join(this.#dedupDirectory, 'settings.json'))
      }

    _getSettings(){
        throw new Error('_getSettings not implemented')
    }


    async vacuum(abortController){
        // delete any files in a subdirectory without any other usage
        // don't delete settings
        // don't do everything in parallel, there are millions of files
    }
}


export class XAttrLinkDeduplicatedFileStore extends AbstractDeduplicatedFileStore{

    #attributeKey = `user.hash.${this.hashMethod}`


    async _retrieveHash(path){
        let value 
        try{
            value = await getExtendedAttribute(this.handler.getFilePath( '/'+path), this.#attributeKey)
        }catch(err){
            await this.handler.stat(path) // will throw if file does not exists
        }            
        return value
    }

    async _saveHash(path, hash){
        const current = await this._retrieveHash(path)
        if(current !== undefined){
            if(current !== hash){
                throw new Error(' NOPE',{current, value, attributeName})
            }
            return // attributes already have the right value 
        }
        await setExtendedAttribute(this.handler.getFilePath( '/'+path), this.#attributeKey, hash)
    }

    
    _getSettings(){
        return {
            type: "XAttrLinkDeduplicated"
        }
    }

    async init(){
        const supported = await checkSupport(this.handler)
        assert.strictEqual(supported.extendedAttributes, true, 'remote must support extended attributes')
        await super.init()
        console.log('XAttrLinkDeduplicatedFileStore init done')
    }

}



export class FileLinkDeduplicatedFileStore extends AbstractDeduplicatedFileStore{

    #attributeKey = `${this.hashMethod}`
    
    #computeHashFileName(path){
        return `${path}.${this.#attributeKey}`
    }

    async _retrieveHash(path){
        try{
            const hash = await this.handler._readFile(this.#computeHashFileName(path))
            return hash
          }catch(err){
            if(err.code === 'ENOENT'){
              return 
            }
            throw err
          }
    }

    async _saveHash(path, hash){
        // directly call writeFile to ensure this file won't be deduplicated
        // thus creating an infinite loop of hash file
        return  this.handler.writeFile(this.#computeHashFileName(path), hash) 
    }

    async remove(path){
        await super.remove(path)
        return this.handler.unlink(this.#computeHashFileName(path))
    }

    async move(from, to){
        await super.move(from , to )
        await this.handler.rename(this.#computeHashFileName(from), this.#computeHashFileName(to))  
    }
     
    _getSettings(){
        return {
            type: "FileLinkDeduplicated"
        }
    }

}

async function checkSupport(handler){

    const supported = {}
    const sourceFileName = `${Date.now()}.sourcededup` 

    const SIZE = 1024 * 1024
    const data = await fromCallback(randomBytes, SIZE)
    const ATTR_NAME = 'user.application'
    const ATTR_VALUE = 'XO'
    await handler._outputFile(sourceFileName, data, { flags: 'wx' })
    const destFileName = `${Date.now()}.destdedup` 

    try {
      await handler.link(sourceFileName, destFileName)
      const linkedData = await handler._readFile(destFileName)

      const { nlink } = await handler.stat(destFileName)
      // contains the right data and the link counter
      supported.hardLink = nlink === 2 && linkedData.equals(data)
      // contains the right data and the link counter
    } catch (error) {
        console.log(`error while testing the dedup`, { error })
    } finally {
        ignoreErrors.call(handler._unlink(destFileName))
    }

    try {
        await setExtendedAttribute(handler.getFilePath(sourceFileName),ATTR_NAME,ATTR_VALUE)
        supported.extendedAttributes = ATTR_VALUE === (await  getExtendedAttribute(handler.getFilePath(sourceFileName), ATTR_NAME))
      } catch (error) {
        console.log(`error while testing the dedup`, { error })
      } 
      
    ignoreErrors.call(handler._unlink(sourceFileName))
    

    return supported 
}

export async function createFileStoreFactory({ handler,  storeDirectory  }){
    console.log('create')
    try{
        JSON.parse(
            await handler.readFile(path.join('/',storeDirectory, 'settings.json'))
        )
        throw new Error('A chunk store already exists in this remote')
    }catch(err) {
        // either missing file or broken json, let's create the store 
    }


    //if(!handler._remote.deduplicate){
    console.log(handler.useVhdDirectory(),handler.getFilePath ,handler.stat)
    if(!handler.useVhdDirectory() || !handler.getFilePath || !handler.stat){
        return new RemoteImmutableFileStore(handler)
    }

    console.log('WILL CREATE A FUNKY remote')
    const supported = await checkSupport(handler)

    let store
    if(supported.hardLink){
        if(supported.extendedAttributes){
            store = new XAttrLinkDeduplicatedFileStore(handler, storeDirectory)
        } else {
            store = new FileLinkDeduplicatedFileStore(handler,storeDirectory)
        }
    } else {
        store = new RemoteImmutableFileStore(handler)
    }
    return store 
}

export async function openFileStoreFactory({handler, storeDirectory }){
    console.log('open')
    const content = JSON.parse(
        await handler.readFile(path.join('/',storeDirectory, 'settings.json'))
    )
    console.log('got ', {content})
    switch( content.type){
        case 'XAttrLinkDeduplicated':
            return  new XAttrLinkDeduplicatedFileStore(handler, storeDirectory)
        case 'FileLinkDeduplicated':
            return new FileLinkDeduplicatedFileStore(handler, storeDirectory)
        default:
            throw new Error(`Chunk store of type ${content.type} unhanlded`)
    }
}

export async function getOrCreateStore({handler, storeDirectory = STORE_DIRECTORY}){
    console.log('getOrCreate')
    let store
    try{
        store = await openFileStoreFactory({handler, storeDirectory})
    }catch(err){
        console.log('CODE', err.code, err)
        if(err.code === 'ENOENT'){
            store = await createFileStoreFactory({handler, storeDirectory})
            await store.init()
        }
    }
    console.log('GOT STORE', {store})
    return store
}