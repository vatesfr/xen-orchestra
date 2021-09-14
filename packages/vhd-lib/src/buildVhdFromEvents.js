import assert from 'assert'
import ConcurrencyPromises from './concurrencyPromises'
import * as Cppzst from '@fstnetwork/cppzst'
import { gzip } from 'zlib'

const compress = (buffer, extension) => {
  switch (extension) {
    case 'gz':
      return new Promise((resolve, reject) => {
        gzip(buffer, { compress: 1 }, (err, compressed) => {
          if (err) {
            reject(err)
          } else {
            resolve(compressed)
          }
        })
      })
    case 'zstd':
      return Cppzst.compress(buffer)
    default:
      throw new Error(extension + ' inconnue')
  }
}

class VhdOutputStreamCreator {
  constructor(outputStream) {
    this.currentOffset = 0
    this.outputStream = outputStream
  }

  write(data, offset) {
    this.pad(offset - this.currentOffset)

    if (data instanceof Buffer) {
      return this.writeBuffer(data, offset)
    }
    return this.writeStream(data, offset)
  }

  async writeBuffer(data, offset = null) {
    if (offset === null) {
      offset = this.currentOffset
    }

    assert(
      offset >= this.currentOffset,
      `try to write a block in an already handled part ${offset} ${this.currentOffset}`
    )
    assert(this.outputStream.writable)
    this.currentOffset += data.length

    await this.outputStream.write(data)
  }

  async pad(length, fill = 0) {
    if (!length) {
      return
    }
    await this.write(Buffer.alloc(length, fill))
  }
  async end() {
    await this.outputStream.end()
  }

  writeStream(stream, offset, size) {
    return new Promise((resolve, reject) => {
      let length = 0
      stream.on('data', chunk => {
        length += chunk.length
        this.outputStream.write(chunk)
      })
      stream.on('error', e => reject(e))
      stream.on('end', () => {
        this.currentOffset += length
        resolve()
      })
    })
  }
}

export function eventsToStream(eventEmitter, { outputStream }) {
  return new Promise((resolve, reject) => {
    const creator = new VhdOutputStreamCreator(outputStream)
    let footerBuf = null
    eventEmitter.on('footer', footer => {
      footerBuf = footer
      creator.write(footer, 0)
    })

    eventEmitter.on('header', async bufHeader => {
      await creator.write(bufHeader, 512)
    })

    eventEmitter.on('bat', async (bat, batOffset) => {
      await creator.write(bat, batOffset)
    })
    eventEmitter.on('block', async (block, offset, size) => {
      await creator.write(block, offset, size)
    })
    eventEmitter.on('parentLocator', async (parentLocator, offset, size) => {
      await creator.write(parentLocator, offset, size)
    })

    eventEmitter.on('end', async () => {
      assert(!!footerBuf, 'footer must be before end')
      await creator.write(footerBuf)
      await creator.end({})
      resolve()
    })

    eventEmitter.on('error', error => {
      reject(error)
    })
  })
}

export function eventsToS3(eventEmitter, { s3, bucket, dir, maxConcurrency, compressed }) {
  return new Promise(resolve => {
    const cp = new ConcurrencyPromises({ maxConcurrency })
    let storedSize = 0
    let compressionDuration = 0
    let transfertDuration = 0
    let contentSize = 0
    const start = new Date()
    const saveBlock = async (data, offset, type, size) => {
      const stringOffset = '' + offset
      const fileMask = '000000000000'
      let fileName = fileMask.substring(0, fileMask.length - stringOffset.length) + stringOffset + '/' + type
      fileName += compressed ? '.' + compressed : ''
      const before = new Date()
      const content = compressed ? await compress(data, compressed) : data
      const afterCompression = new Date()

      storedSize += content.length
      contentSize += data.length
      compressionDuration += afterCompression - before

      await s3.putObject({
        Bucket: bucket,
        Body: content,
        Key: dir + fileName,
        ContentLength: content.length,
      })
      transfertDuration += new Date() - afterCompression
    }

    eventEmitter.on('footer', async (footer, offset) => {
      await saveBlock(footer, offset, 'footer')
    })

    eventEmitter.on('header', async (header, offset) => {
      await saveBlock(header, offset, 'header')
    })

    eventEmitter.on('bat', async (bat, offset) => {
      await saveBlock(bat, offset, 'bat')
    })
    eventEmitter.on('block', async (block, offset, size) => {
      await cp.add(saveBlock, null, [block, offset, 'block', size])
    })
    eventEmitter.on('parentLocator', async (parentLocator, offset, size) => {
      await saveBlock(parentLocator, offset, 'parentLocator', size)
    })
    eventEmitter.on('end', () => {
      cp.on('end', () => {
        resolve({
          contentSize,
          storedSize,
          compressionDuration,
          transfertDuration,
          totalDuration: new Date() - start,
        })
      })
    })
  })
}

export const instantiateBuilder = (type, eventEmitter, opts) => {
  switch (type) {
    case 'stream':
      return eventsToStream(eventEmitter, opts)
    case 's3':
      return eventsToS3(eventEmitter, opts)
    default:
      throw new Error(`type ${type} is not supported in vhdparser`)
  }
}

export default { instantiateBuilder }
