import { readChunkStrict, skipStrict } from '@vates/read-chunk'
import { createLogger } from '@xen-orchestra/log'

const { debug } = createLogger('xo:vmware-explorer:vmffileaccessor')
//const debug = console.log
/**
 * Implementation of FileAccessor for interacting with an ESXi datastore.
 * Since most of the reading is done sequentially : works by opening a stream
 * adn reading from it
 * @implements {FileAccessor}
 */
export class EsxiDatastore {
  /**
   * @type {string}
   */
  #datastore
  /**
   * @param {Esxi} esxi - An instance of the Esxi class.
   * @param {string} datastore - An instance of the Esxi class.
   */
  constructor(esxi, datastore) {
    this.#esxi = esxi
    this.#datastore = datastore
    this.#descriptors = new Map() // Map to associate descriptors with paths/stream/size
    this.#nextDescriptor = 0 // Counter to generate unique descriptors
    this.#activeReads = new Map() // Map to manage ongoing reads
  }

  // Private members
  #esxi
  #descriptors
  #nextDescriptor
  #activeReads

  /**
   * Opens a stream for a given path and returns a descriptor.
   * @param {string} path - The file path.
   * @param {number?} from - Starting position (optional).
   * @param {number?} to - Ending position (optional).
   * @param {number?} descriptorId - reuse a descriptor number
   * @returns {Promise<number>} - A file descriptor.
   */
  async open(path, from, to, descriptorId) {
    debug('open ', { path, from , to, descriptorId})
    const newDescriptorId = descriptorId ?? this.#nextDescriptor++
    const res = await this.#esxi.download(this.#datastore, path, from || to ? `${from}-${to}` : undefined)
    const stream = res.body
    const size = Number(res.headers.get('content-length')) + (from ?? 0)

    debug('open successfull ', {path, from , to, newDescriptorId})
    this.#descriptors.set(newDescriptorId, { stream, size, path, from, to: to ?? size, currentPosition: from ?? 0 })
    return newDescriptorId
  }


  /**
   * 
   * @param {number} descriptorId 
   * @param {number} lengthToSkip 
   * @returns void
   */

  async #skipStrict(descriptorId, lengthToSkip){
    if (!this.#descriptors.has(descriptorId)) {
      throw new Error('Descriptor not found')
    }
    const descriptor = this.#descriptors.get(descriptorId)
    await skipStrict(descriptor.stream,lengthToSkip)
    descriptor.currentPosition += lengthToSkip
  }
  /**
   * 
   * @param {number} descriptorId 
   * @param {number} lengthToRead 
   * @returns Promise<Buffer>
   */
  async #readStrict(descriptorId, lengthToRead){
    if (!this.#descriptors.has(descriptorId)) {
      throw new Error('Descriptor not found')
    }
    const descriptor = this.#descriptors.get(descriptorId)
    const buffer = await readChunkStrict(descriptor.stream,lengthToRead)
    descriptor.currentPosition += lengthToRead
    return buffer
  }

  /**
   * Reads data from a previously opened stream.
   * @param {number} fileDescriptorId - The file descriptor.
   * @param {Buffer} buffer - The pre allocated buffer that will contains the data
   * @param {number?} from - Starting position.
   * @returns {Promise<{buffer:Buffer, bytes_read:number}>} - The read data.
   */

  async read(fileDescriptorId, buffer, from) {
    debug('read ', {fileDescriptorId, from, length: buffer.length})
    if (!this.#descriptors.has(fileDescriptorId)) {
      throw new Error(`Descriptor ${fileDescriptorId} not found in ${[...this.#descriptors.keys()]}`)
    }
    const to = from + buffer.length
    const descriptor = this.#descriptors.get(fileDescriptorId)
    const { path, to: opennedTo, currentPosition, size } = descriptor
    if (to > opennedTo) {
      throw new Error(`Try to read ${from}-${to}, after the end of the file ${opennedTo} , size ${size} for ${path}`)
    }

    // Check if a read is already in progress for this descriptor
    if (this.#activeReads.has(fileDescriptorId)) {
      debug('read already reading stream ', {fileDescriptorId})
      await this.#activeReads.get(fileDescriptorId)
      debug('read stream read in parallel done ', {fileDescriptorId})
    }

    // Handle parallel reads
    const readPromise = (async () => {
      const maxSkipSize = 2 * 1024 * 1024 // 2MB

      // If the distance to skip is less than 2MB, skip
      if (currentPosition < from && from - currentPosition <= maxSkipSize) {
        debug('will skip ', {fileDescriptorId,skip: from - currentPosition})
        await this.#skipStrict(fileDescriptorId, from - currentPosition)
      } else {
        if (currentPosition !== from ){
          debug('will reopen ',  {fileDescriptorId,from , currentPosition})
          // Otherwise, close and reopen the stream
          this.close(fileDescriptorId)
          // open the stream until the end, we'll reuse it if possible
          await this.open(path, from,size, fileDescriptorId)
        } else {
          debug('already there ',  {fileDescriptorId})
        }
      }

      // Read the requested data
      const sizeToRead = to - from
      debug('will read ', {fileDescriptorId,from ,  sizeToRead, size})

      const buffer = await this.#readStrict(fileDescriptorId, sizeToRead)
      return buffer
    })()

    // Store the read promise to avoid parallel reads
    this.#activeReads.set(fileDescriptorId, readPromise)
    const result = await readPromise
    this.#activeReads.delete(fileDescriptorId)
    result.copy(buffer)
    return { buffer, bytes_read: buffer.length }
  }

  /**
   * Closes a previously opened stream.
   * @param {number} descriptor - The file descriptor.
   */
  close(descriptor) {
    debug('will reopen ',  {descriptor})
    if (this.#descriptors.has(descriptor)) {
      const { stream } = this.#descriptors.get(descriptor)
      stream.destroy() // Close the stream
      debug('stream destroyed ',  {descriptor})
      this.#descriptors.delete(descriptor)
    }
  }

  /**
   * Reads the entire content of a file.
   * @param {string} path - The file path.
   * @returns {Promise<Buffer>} - The file content.
   */
  async readFile(path) {
    const descriptor = await this.open(path)
    const { stream } = this.#descriptors.get(descriptor)
    const chunks = []

    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    this.close(descriptor)
    return Buffer.concat(chunks)
  }

  async getSize(path) {
    const descriptor = await this.open(path)
    const { size } = this.#descriptors.get(descriptor)
    this.close(descriptor)
    return size
  }
  mktree(path) {
    throw new Error('not implemented')
  }
  rmtree(path) {
    throw new Error('not implemented')
  }
  unlink(path) {
    throw new Error('not implemented')
  }
  outputStream(stream) {
    throw new Error('not implemented')
  }
}
