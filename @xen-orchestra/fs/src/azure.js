import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import { createLogger } from '@xen-orchestra/log'
import { parse } from 'xo-remote-parser'
import { join, split } from './path'
import RemoteHandlerAbstract from './abstract'
import { pRetry } from 'promise-toolbox'
import { asyncEach } from '@vates/async-each'

createLogger('xo:fs:azure')
const MAX_BLOCK_SIZE = 1024 * 1024 * 4000 // 4000 MiB
const MIN_BLOCK_SIZE = 1024 * 4 // 4 KiB
const MAX_BLOCK_COUNT = 50000
const { warn, info } = createLogger('xo:fs:azure')

export default class AzureHandler extends RemoteHandlerAbstract {
  #container
  #dir
  #blobServiceClient
  #containerClient

  constructor(remote, _opts) {
    super(remote)
    const { username, path, password, host, protocol } = parse(remote.url)

    if (host) {
      info('Connecting to Azurite blob storage emulator...')
      this.#blobServiceClient = BlobServiceClient.fromConnectionString(
        `DefaultEndpointsProtocol=${protocol};AccountName=${username};AccountKey=${password};BlobEndpoint=${protocol}://${host}/${username}`
      )
    } else {
      info('Connecting to Azure blob storage...')
      const credentials = new StorageSharedKeyCredential(username, password)
      this.#blobServiceClient = new BlobServiceClient(`${protocol}://${username}.blob.core.windows.net`, credentials)
    }

    const parts = split(path)
    this.#container = parts.shift()
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

  #makePrefix(path) {
    return path === '/' ? '' : path.endsWith('/') ? path : `${path}/`
  }

  async #isNotEmptyDir(dir) {
    const prefix = this.#makePrefix(dir)
    const iterator = this.#containerClient.listBlobsFlat({ prefix }).byPage({ maxPageSize: 1 })

    const { value } = await iterator.next()
    return (value?.segment?.blobItems?.length ?? 0) > 0
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

  async _sync() {
    await this.#containerClient.createIfNotExists()
    await super._sync()
  }

  async _outputStream(file, data) {
    if (data.length < MIN_BLOCK_SIZE) {
      await this._writeFile(file, data)
      return
    }

    const blobClient = this.#containerClient.getBlockBlobClient(file)
    const blockCount = Math.ceil(data.length / MAX_BLOCK_SIZE)

    if (blockCount > MAX_BLOCK_COUNT) {
      throw new Error(`File too large. Maximum upload size is ${MAX_BLOCK_SIZE * MAX_BLOCK_COUNT} bytes`)
    }
    const blockIds = []

    for (let i = 0; i < blockCount; i++) {
      const blockId = Buffer.from(i.toString().padStart(6, '0')).toString('base64')
      blockIds.push(blockId)

      const start = i * MAX_BLOCK_SIZE
      const end = Math.min(start + MAX_BLOCK_SIZE, data.length)
      const chunk = data.slice(start, end)

      await blobClient.stageBlock(blockId, chunk, chunk.length)
    }

    await blobClient.commitBlockList(blockIds)
  }

  // list blobs in container
  async _list(path) {
    const result = []
    for await (const item of this.#containerClient.listBlobsByHierarchy('/', { prefix: this.#makePrefix(path) })) {
      const strippedName = item.name.replace(`${path}/`, '')
      result.push(strippedName.endsWith('/') ? strippedName.slice(0, -1) : strippedName)
    }
    return result
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
    const blobClient = this.#containerClient.getBlobClient(file)
    await blobClient.delete()
  }

  async _rename(oldPath, newPath) {
    await this._copy(oldPath, newPath)
    await this._unlink(oldPath)
  }

  async _copy(oldPath, newPath) {
    const sourceBlob = this.#containerClient.getBlobClient(oldPath)
    const destinationBlob = this.#containerClient.getBlobClient(newPath)
    await destinationBlob.beginCopyFromURL(sourceBlob.url, { requiresSync: true })
  }

  async _getSize(file) {
    const blobClient = this.#containerClient.getBlobClient(file)
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

  async _rmtree(path) {
    const iter = this.#containerClient.listBlobsFlat({ prefix: this.#makePrefix(path) })
    await asyncEach(
      iter,
      async item => {
        if (item.kind === 'prefix') {
          await this._rmtree(item.name)
        } else {
          await this._unlink(item.name)
        }
      },
      {
        concurrency: 8,
      }
    )
  }
}
