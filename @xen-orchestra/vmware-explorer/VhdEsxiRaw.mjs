
import assert from 'node:assert'
import { VhdAbstract} from 'vhd-lib'
import { createFooter, createHeader } from 'vhd-lib/_createFooterHeader.js'
import _computeGeometryForSize from 'vhd-lib/_computeGeometryForSize.js'
import { DISK_TYPES, FOOTER_SIZE } from 'vhd-lib/_constants.js'
import { unpackFooter, unpackHeader } from 'vhd-lib/Vhd/_utils.js'
import { readChunk } from '@vates/read-chunk'
import { fromEvent } from 'promise-toolbox'


const VHD_BLOCK_LENGTH = 2*1024*1024
export default class VhdEsxiRaw extends VhdAbstract{
  #esxi
  #datastore
  #path

  #bat
  #header
  #footer

  #stream
  #bytesRead = 0


  static async open(esxi, datastore, path) {
    console.log('VhdEsxiRaw.open ', datastore, path)
    const vhd = new VhdEsxiRaw(esxi, datastore, path)
    console.log('VhdEsxiRaw.open instantiated ')
    await vhd.readHeaderAndFooter()
    console.log('VhdEsxiRaw.open readHeaderAndFooter ')
    return vhd
  }

  get header() {
    return this.#header
  }

  get footer() {
    return this.#footer
  }

  constructor(esxi, datastore, path){
    super()
    this.#esxi = esxi
    this.#path = path
    this.#datastore = datastore
  }

  async readHeaderAndFooter(checkSecondFooter = true) {
    const res = await this.#esxi.download(this.#datastore, this.#path)
    const length = res.headers.get('content-length')
    console.log(res.headers, length)

    this.#header = unpackHeader(createHeader(length / VHD_BLOCK_LENGTH))
    console.log('headzer ok')
    const geometry = _computeGeometryForSize(length)
    console.log('geometry ok')
    const actualSize = geometry.actualSize

    this.#footer =  unpackFooter(createFooter(actualSize, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, DISK_TYPES.DYNAMIC))
    console.log('readHeaderAndFooter ok')
  }

  containsBlock(blockId) {
    assert.notEqual(this.#bat, undefined)
    return this.#bat.has(blockId)

  }

  async readBlock(blockId){
    const start =  blockId * VHD_BLOCK_LENGTH
    if(!this.#stream){
      this.#stream = (await this.#esxi.download(this.#datastore, this.#path)).body
      this.#bytesRead = 0
    }
    if(this.#bytesRead > start){
      console.log('back ')
      this.#stream.destroy()
      this.#stream = (await this.#esxi.download(this.#datastore, this.#path,`${start}-${this.footer.currentSize}`)).body
      this.#bytesRead = start
    }

    if(start- this.#bytesRead > 0){
      console.log('fast forward',`${start}-${this.footer.currentSize}`)
      this.#stream.destroy()
      this.#stream = (await this.#esxi.download(this.#datastore, this.#path,`${start}-${this.footer.currentSize}`)).body
      this.#bytesRead = start
    }

    console.log('before', {bytesRead: this.#bytesRead, remaining:start- this.#bytesRead })
    /*
    while(this.#bytesRead < start ){
      const buf = await readChunk(this.#stream,Math.min(start- this.#bytesRead, VHD_BLOCK_LENGTH))
      this.#bytesRead += buf.length
    }*/
    const data = await readChunk(this.#stream, VHD_BLOCK_LENGTH)
    this.#bytesRead += data.length
    const bitmap= Buffer.alloc(512,255)
    console.log(blockId, {start, length: data.length})
    return {
      id: blockId,
      bitmap,
      data,
      buffer: Buffer.concat([bitmap, data]),
    }
  }

  async readBlockAllocationTable() {
    console.log('readBlockAllocationTable ')

    const res = await this.#esxi.download(this.#datastore, this.#path)
    const length = res.headers.get('content-length')
    const stream = res.body
    console.log({headers: res.headers, length})

    const empty = Buffer.alloc(VHD_BLOCK_LENGTH, 0)
    let pos = 0
    this.#bat = new Set()
    let nextChunkLength =  Math.min(VHD_BLOCK_LENGTH, length)
    const progress = setInterval(()=>{
      console.log(pos/VHD_BLOCK_LENGTH, pos,  this.#bat.size)
    }, 10 * 1000)

    await fromEvent(stream, 'readable')
    while(nextChunkLength > 0 ){
      const chunk = await readChunk(stream, nextChunkLength)
      let isEmpty
      if(nextChunkLength === VHD_BLOCK_LENGTH){
        isEmpty = empty.equals(chunk)
      } else {
        // last block can be smaller
        isEmpty = Buffer.alloc(nextChunkLength , 0).equals(chunk)
      }
      if(!isEmpty){
        this.#bat.add(pos/VHD_BLOCK_LENGTH)
      }
      pos += VHD_BLOCK_LENGTH
      nextChunkLength = Math.min(VHD_BLOCK_LENGTH, length - pos)
    }
    clearInterval(progress)



  }
}
