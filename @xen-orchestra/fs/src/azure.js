import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import { createLogger } from '@xen-orchestra/log'
import { parse } from 'xo-remote-parser'
import { join, split } from './path'
import RemoteHandlerAbstract from './abstract'
import { pRetry } from 'promise-toolbox'
import { readChunk } from '@vates/read-chunk'
import copyStreamToBuffer from './_copyStreamToBuffer'

createLogger('xo:fs:azure')
const MAX_BLOCK_SIZE = 1024 * 1024 * 4000 // 4000 MiB
const MIN_BLOCK_SIZE = 1024 * 4 // 4 KiB
const MAX_BLOCK_COUNT = 50000
const AZURE_BATCH_MAX_REQUEST = 256 // BATCH_MAX_REQUEST constant from Azure
const { warn, info } = createLogger('xo:fs:azure')

export default class AzureHandler extends RemoteHandlerAbstract {
  #container
  #dir
  #blobServiceClient
  #containerClient

  constructor(remote, _opts) {
    super(remote)
    const { username, path, password, host, protocol } = parse(remote.url)
    const credential = new StorageSharedKeyCredential(username, password)

    // if azurite, we need to put the username in url
    // if azure, we only need the host. Until now, it is {username}.blob.core.windows.net
    const url = remote.url.startsWith('azure:') ? `${protocol}://${host}` : `${protocol}://${host}/${username}`

    info('Connecting to Azure blob storage...')
    this.#blobServiceClient = new BlobServiceClient(url, credential)

    const parts = split(path)
    this.#container = parts.shift() // in azurite, container = first component after host, only lowercase allowed
    this.#dir = join(...parts)
    this.#containerClient = this.#blobServiceClient.getContainerClient(this.#container)
    const WITH_RETRY = ['_copy', '_getSize', '_list', '_outputFile', '_read', '_rename', '_unlink', '_writeFile']
    WITH_RETRY.forEach(functionName => {
      if (this[functionName] !== undefined) {
        this[functionName] = pRetry.wrap(this[functionName], {
          delays: [100, 200, 500, 1000, 2000],
          when: err => !['SystemInUse'].includes(err?.code),
          onRetry(error) {
            warn('retrying method on fs ', {
              method: functionName,
              attemptNumber: this.attemptNumber,
              delay: this.delay,
              error,
              file: this.arguments?.[0],
            })
          },
        })
      }
    })
  }

  get type() {
    return 'azure'
  }

  /**
   *
   * @param {string} path String to format
   * @returns add / at the end of path to allow azure to understand it is a "folder"
   */
  #makePrefix(path) {
    return path === '.' ? '' : path.endsWith('/') ? path : `${path}/`
  }

  #makeFullPath(path, isDir = false) {
    let prefixedPath = path
    if (path.startsWith('/')) {
      prefixedPath = path.substring(1)
    }
    prefixedPath = isDir ? this.#makePrefix(prefixedPath) : prefixedPath
    prefixedPath = `${this.#makePrefix(this.#dir)}${prefixedPath}`
    return prefixedPath
  }

  /**
   *
   * @param {string} dir
   * @returns true if dir is not empty
   */
  async #isNotEmptyDir(dir) {
    const prefix = this.#makePrefix(dir)
    const iterator = this.#containerClient.listBlobsFlat({ prefix }).byPage({ maxPageSize: 1 })

    const { value } = await iterator.next()
    return (value?.segment?.blobItems?.length ?? 0) > 0
  }

  /**
   * Create container if it does not exist
   */
  async _sync() {
    await this.#containerClient.createIfNotExists()
    await super._sync()
  }

  /**
   *
   * @param {string} path
   * @param {object} input
   * @param {*} param2
   */
  async _outputStream(path, input, { streamLength, maxStreamLength = streamLength, validator }) {
    const blobClient = this.#containerClient.getBlockBlobClient(this.#makeFullPath(path))
    let blockSize
    if (maxStreamLength === undefined) {
      warn(
        `Writing ${this.#makeFullPath(path)} to a azure blob storage without a max size set will cut it to ${MAX_BLOCK_COUNT * MAX_BLOCK_SIZE} bytes`,
        { path }
      )
      blockSize = MIN_BLOCK_SIZE
    } else {
      const minBlockSize = Math.ceil(maxStreamLength / MAX_BLOCK_COUNT) // Minimal possible block size for the block count allowed
      const adjustedMinSize = Math.max(minBlockSize, MIN_BLOCK_SIZE) // Block size must be larger than minimum block size allowed
      blockSize = Math.min(adjustedMinSize, MAX_BLOCK_SIZE) // Block size must be smaller than max block size allowed
    }

    const blockIds = []
    let blockIndex = 0
    let done = false

    while (!done) {
      if (!input.readable) {
        input.readableEnded = true
        break
      }
      const chunk = await readChunk(input, blockSize)
      if (!chunk || chunk.length === 0) {
        done = true
        break
      }

      const blockId = Buffer.from(blockIndex.toString().padStart(6, '0')).toString('base64')
      blockIds.push(blockId)
      await blobClient.stageBlock(blockId, chunk, chunk.length)
      blockIndex++
    }
    await blobClient.commitBlockList(blockIds)
    if (validator !== undefined) {
      try {
        await validator.call(this, path)
      } catch (error) {
        await this.__unlink(path)
        throw error
      }
    }
  }

  /**
   *
   * @param {string} path folder name inside container and #dir
   * @param {*} options only used for ignoreMissing, if set to true, avoid throing error about empty list
   * @returns list of blobs in folder container/#dir
   */
  async _list(path, options = {}) {
    const { ignoreMissing = false } = options
    const fullPath = this.#makeFullPath(path, true)
    const enoentError = new Error(`ENOENT: No such file or directory from list ${path}`)
    enoentError.code = 'ENOENT'
    enoentError.path = path
    try {
      const result = []
      for await (const item of this.#containerClient.listBlobsByHierarchy('/', { prefix: fullPath })) {
        const strippedName = item.name.replace(`${fullPath}`, '')
        result.push(strippedName.endsWith('/') ? strippedName.slice(0, -1) : strippedName)
      }
      if (result.length === 0 && !ignoreMissing) {
        throw enoentError
      }
      return result
    } catch (e) {
      if (e.statusCode === 404) {
        throw enoentError
      }
      throw e
    }
  }

  // uploads a file to a blob
  async _writeFile(file, data) {
    const blobClient = this.#containerClient.getBlockBlobClient(this.#makeFullPath(file))
    await blobClient.upload(data, data.length)
  }

  async _createReadStream(file) {
    try {
      const blobClient = this.#containerClient.getBlobClient(this.#makeFullPath(file))
      const response = await blobClient.download()
      return await response.readableStreamBody
    } catch (e) {
      if (e.name === 'RestError' && e.code === 'BlobNotFound') {
        const error = new Error(`ENOENT: no such file '${file}'`, e)
        error.code = 'ENOENT'
        error.path = file
        throw error
      }
    }
  }

  async _unlink(file) {
    if (await this.#isNotEmptyDir(file)) {
      const error = new Error(`EISDIR: illegal operation on a directory, unlink '${file}'`)
      error.code = 'EISDIR'
      error.path = file
      throw error
    }
    try {
      const blobClient = this.#containerClient.getBlobClient(this.#makeFullPath(file))
      await blobClient.delete()
    } catch (e) {
      if (e.name === 'RestError' && ![400, 404].includes(e.statusCode)) {
        throw e
      }
    }
  }

  async rename(oldPath, newPath) {
    await this._copy(oldPath, newPath)
    await this._unlink(oldPath)
  }

  async _copy(oldPath, newPath) {
    const error = new Error(`ENOENT: no such file '${oldPath}'`)
    error.code = 'ENOENT'
    error.path = oldPath
    try {
      const sourceBlob = this.#containerClient.getBlobClient(this.#makeFullPath(oldPath))
      const exists = await sourceBlob.exists()
      if (!exists) {
        throw error
      }
      const destinationBlob = this.#containerClient.getBlobClient(this.#makeFullPath(newPath))
      await destinationBlob.beginCopyFromURL(sourceBlob.url, { requiresSync: true })
    } catch (e) {
      if (e.statusCode === 404) {
        throw error
      }
      throw e
    }
  }

  async _getSize(file) {
    if (typeof file !== 'string') {
      file = file.fd
    }
    const blobClient = this.#containerClient.getBlobClient(this.#makeFullPath(file))
    const properties = await blobClient.getProperties()
    return properties.contentLength
  }

  async _read(file, buffer, position = 0) {
    if (typeof file !== 'string') {
      file = file.fd
    }
    try {
      const blobClient = this.#containerClient.getBlobClient(this.#makeFullPath(file))
      const downloadResponse = await blobClient.download(position, buffer.length)
      const bytesRead = await copyStreamToBuffer(downloadResponse.readableStreamBody, buffer)
      return { bytesRead, buffer }
    } catch (e) {
      if (e.statusCode === 404) {
        if (await this.#isNotEmptyDir(file)) {
          const error = new Error(`${file} is a directory`)
          error.code = 'EISDIR'
          error.path = file
          throw error
        }
      }
      throw e
    }
  }

  async _mkdir(path) {
    const blobClient = this.#containerClient.getBlobClient(this.#makeFullPath(path))
    if (await blobClient.exists()) {
      const error = new Error(`ENOTDIR: file already exists, mkdir '${path}'`)
      error.code = 'ENOTDIR'
      error.path = path
      throw error
    }
  }
  async _writeFd(file, buffer, position) {
    if (typeof file !== 'string') {
      file = file.fd
    }

    const blobClient = this.#containerClient.getBlockBlobClient(this.#makeFullPath(file))
    const blockSize = MIN_BLOCK_SIZE
    const blockIds = []
    let totalWritten = 0
    let blockIndex = 0

    while (totalWritten < buffer.length) {
      const chunkSize = Math.min(blockSize, buffer.length - totalWritten)
      const chunk = buffer.slice(totalWritten, totalWritten + chunkSize)

      const blockId = Buffer.from(blockIndex.toString().padStart(6, '0')).toString('base64')
      blockIds.push(blockId)
      await blobClient.stageBlock(blockId, chunk, chunkSize)
      totalWritten += chunkSize
      blockIndex++
    }

    await blobClient.commitBlockList(blockIds)
  }

  async _openFile(path, flags) {
    return path
  }

  async _closeFile(fd) {}

  async _rmtree(path) {
    const blobIterator = this.#containerClient.listBlobsFlat({ prefix: this.#makeFullPath(path, true) })
    const blobBatchClient = this.#containerClient.getBlobBatchClient()
    let batch = blobBatchClient.createBatch()
    for await (const urlOrBlobClient of blobIterator) {
      await batch.deleteBlob(this.#containerClient.getBlobClient(urlOrBlobClient.name))
      if (batch.batchRequest.operationCount >= AZURE_BATCH_MAX_REQUEST - 1) {
        await blobBatchClient.submitBatch(batch)
        batch = blobBatchClient.createBatch()
      }
    }
    if (batch.batchRequest.operationCount > 0) {
      await blobBatchClient.submitBatch(batch)
    }
  }
}
