import { BlobServiceClient } from '@azure/storage-blob'
import { createLogger } from '@xen-orchestra/log'
import { parse } from 'xo-remote-parser'
import { basename, join, split } from './path'
import RemoteHandlerAbstract from './abstract'
import { pRetry } from 'promise-toolbox'

createLogger('xo:fs:azure')
const MAX_BLOCK_SIZE = 1024 * 1024 * 1024 * 1024 * 4
const MAX_BLOCK_COUNT = 1250
const { warn } = createLogger('xo:fs:azure')

// <http|https>://<account-name>.<service-name>.core.windows.net/<resource-path>

export default class AzureHandler extends RemoteHandlerAbstract {
  #container
  #dir
  #blobServiceClient
  #containerClient

  constructor(remote, _opts) {
    super(remote)
    const { username, path, password, host, protocol } = parse(remote.url)
    /* 
For Azure not Azurite
 --------------------
  const credentials = new StorageSharedKeyCredential(username, password);
  this.#blobServiceClient = new BlobServiceClient(`${protocol}://${username}.blob.core.windows.net`, credentials);
 --------------------
*/

    // this works ONLY for Azurite
    this.#blobServiceClient = BlobServiceClient.fromConnectionString(
      `DefaultEndpointsProtocol=${protocol};AccountName=${username};AccountKey=${password};BlobEndpoint=${protocol}://${host}/${username}`
    )

    const parts = split(path)
    this.#container = parts.shift()
    this.#dir = join(...parts)
    this.#containerClient = this.#blobServiceClient.getContainerClient(this.#container)
    const WITH_RETRY = ['_copy', '_getSize', '_list', '_outputFile', '_read', '_rename', '_unlink', '_writeFile']
    WITH_RETRY.forEach(functionName => {
      if (this[functionName] !== undefined) {
        this[functionName] = pRetry.wrap(this[functionName], {
          delays: [100, 200, 500, 1000, 2000],
          when: err => !['EEXIST', 'EISDIR', 'ENOTEMPTY', 'ENOENT', 'ENOTDIR', 'EISDIR'].includes(err?.code),
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

  async _sync() {
    await super._sync()
    await this.#containerClient.createIfNotExists()
  }

  async #findBlobClient(file) {
    return this.#containerClient.getBlobClient(file)
  }

  async #makePrefix(path) {
    return path.endsWith('/') ? path : `${path}/`
  }

  async #isNotEmptyDir(dir) {
    const prefix = this.#makePrefix(dir)
    const iterator = this.#containerClient.listBlobsFlat({ prefix }).byPage({ maxPageSize: 1 })

    const { value } = await iterator.next()
    return !!(value && value.segment && value.segment.blobItems.length)
  }

  async #streamToBuffer(readableStream, buffer) {
    return new Promise((resolve, reject) => {
      let bytesRead = 0

      readableStream.on('data', data => {
        if (bytesRead + data.length <= buffer.length) {
          data.copy(buffer, bytesRead)
          bytesRead += data.length
        } else {
          reject(new Error('Buffer size exceeded'))
        }
      })
      readableStream.on('end', () => {
        resolve(bytesRead)
      })
      readableStream.on('error', reject)
    })
  }

  // this can be used right away instead of _writeFile func
  async _outputStream(file, data) {
    const blobClient = this.#containerClient.getBlockBlobClient(file)
    await blobClient.uploadStream(data, MAX_BLOCK_SIZE, MAX_BLOCK_COUNT)
  }

  // list blobs in container
  async _list() {
    const files = []
    for await (const blob of this.#containerClient.listBlobsFlat(this.#container)) {
      files.push(basename(blob.name))
    }
    return files
  }

  // uploads a file to a blob
  async _writeFile(file, data) {
    const blobClient = this.#containerClient.getBlockBlobClient(file)
    if (data.length > MAX_BLOCK_SIZE) {
      await this._outputStream(file, data)
    } else {
      await blobClient.upload(data, data.length)
    }
  }

  async _createReadStream() {
    try {
      const blobClient = this.#containerClient.getBlobClient(this.#dir)
      const response = await blobClient.download()
      return await response.readableStreamBody
    } catch (e) {
      if (e.name === 'RestError' && e.statusCode === 404) {
        const error = new Error(`ENOENT: no such file '${this.#dir}'`, e)
        error.code = 'ENOENT'
        error.path = this.#dir
        throw error
      }
    }
  }

  async _unlink(file) {
    const blobClient = this.#findBlobClient(file)
    await blobClient.delete()
  }

  async _rename(oldPath, newPath) {
    await this._copy(oldPath, newPath)
    await this._unlink(oldPath)
  }

  async _copy(oldPath, newPath) {
    const sourceBlob = this.#findBlobClient(oldPath)
    const destinationBlob = this.#findBlobClient(newPath)
    await destinationBlob.beginCopyFromURL(sourceBlob.url, { requiresSync: true })
  }

  async _getSize(file) {
    const blobClient = this.#findBlobClient(file)
    const properties = await blobClient.getProperties()
    return properties.contentLength
  }

  async _read(file, buffer, position = 0) {
    const blobClient = this.#containerClient.getBlobClient(file)

    try {
      const downloadResponse = await blobClient.download(position, buffer.length)
      const bytesRead = await this.#streamToBuffer(downloadResponse.readableStreamBody, buffer)
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
}
