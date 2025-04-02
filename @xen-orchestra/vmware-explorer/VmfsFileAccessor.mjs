import { readChunkStrict, skipStrict } from '@vates/read-chunk'

/**
 * Implementation of FileAccessor for interacting with an ESXi datastore.
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
    const descriptor = descriptorId ?? this.#nextDescriptor++
    const res = await this.#esxi.download(this.#datastore, path, from || to ? `${from}-${to}` : undefined)
    const stream = res.body
    const size = Number(res.headers.get('content-length'))
    this.#descriptors.set(descriptor, { stream, size, path, from, to, currentPosition: from ?? 0 })
    return descriptor
  }

  /**
   * Reads data from a previously opened stream.
   * @param {number} fileDescriptorId - The file descriptor.
   * @param {Buffer} buffer - The pre allocated buffer that will contains the data
   * @param {number?} from - Starting position.
   * @returns {Promise<{buffer:Buffer, bytes_read:number}>} - The read data.
   */
  async read(fileDescriptorId, buffer, from) {
    if (!this.#descriptors.has(fileDescriptorId)) {
      throw new Error('Descriptor not found')
    }
    const to = from + buffer.length
    const descriptor = this.#descriptors.get(fileDescriptorId)
    const { path, stream, size, to: opennedTo, currentPosition } = descriptor
    if (to > size || (opennedTo && opennedTo > to)) {
      throw new Error('Try to read after the end of the file')
    }

    // Check if a read is already in progress for this descriptor
    if (this.#activeReads.has(fileDescriptorId)) {
      await this.#activeReads.get(fileDescriptorId)
    }

    // Handle parallel reads
    const readPromise = (async () => {
      const maxSkipSize = 2 * 1024 * 1024 // 2MB

      // If the distance to skip is less than 2MB, skip
      if (currentPosition < from && from - currentPosition <= maxSkipSize) {
        await skipStrict(stream, from - currentPosition)
      } else {
        // Otherwise, close and reopen the stream
        this.close(fileDescriptorId)
        await this.open(path, from, to, fileDescriptorId)
      }

      // Read the requested data
      const sizeToRead = to - from
      const buffer = await readChunkStrict(stream, sizeToRead)
      fileDescriptorId.currentPosition = to
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
    if (this.#descriptors.has(descriptor)) {
      const { stream } = this.#descriptors.get(descriptor)
      stream.destroy() // Close the stream
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
