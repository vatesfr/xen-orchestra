import assert from 'assert'
import { gzip, ungzip } from 'node-gzip'
import { off } from 'process'

import { fuHeader } from './_structs'

class VhdOutputStreamCreator {
  constructor(outputStream) {
    this.currentOffset = 0
    this.outputStream = outputStream
  }

  async writeFooter(footerData) {
    assert(footerData.length <= 512, `footer  must be 512 bytes of  less ${footerData.length}`)
    await this.write(footerData)
    await this.pad(512 - footerData.length)
  }

  async writeHeader(headerData) {
    assert(headerData.length <= 1024, `headerData must be 1024 bytes of  less ${headerData.length}`)
    await this.write(headerData)
    await this.pad(1024 - headerData.length)
  }

  async write(data, offset = null) {
    if (null === offset) {
      offset = this.currentOffset
    }

    assert(
      offset >= this.currentOffset,
      `try to write a block in an already handled part ${offset} ${this.currentOffset}`
    )
    assert(this.outputStream.writable)
    this.pad(offset - this.currentOffset)
    this.currentOffset += data.length

    await this.outputStream.write(data)
  }

  async pad(length, fill = 0) {
    if (0 === length) {
      return
    }
    await this.write(Buffer.alloc(length, fill))
  }
  async end() {
    console.log('end', this.currentOffset)
    await this.outputStream.end()
  }
}

export function eventsToStream(outputStream, eventEmitter) {
  return new Promise((resolve, reject) => {
    const creator = new VhdOutputStreamCreator(outputStream)
    let header = null
    let footerBuf = null
    eventEmitter.on('footer', footer => {
      footerBuf = footer
      creator.writeFooter(footer)
    })

    eventEmitter.on('header', async bufHeader => {
      header = fuHeader.unpack(bufHeader)
      await creator.writeHeader(bufHeader)
    })

    eventEmitter.on('bat', async bat => {
      assert(!!header, 'header must be before BAT')
      await creator.write(bat, header.tableOffset)
    })
    eventEmitter.on('block', async (block, offset) => {
      await creator.write(block, offset)
    })
    eventEmitter.on('parentLocator', async (parentLocator, offset) => {
      await creator.write(parentLocator, offset)
    })

    eventEmitter.on('end', async () => {
      assert(!!footerBuf, 'footer must be before end')
      await creator.writeFooter(footerBuf)
      await creator.end()
      resolve()
    })

    eventEmitter.on('error', error => {
      reject(error)
    })
  })
}

export function eventsToS3(s3, eventEmitter, bucket, dir) {
  return new Promise((resolve, reject) => {
    const saveBlock = async (data, offset, type) => {
      const stringOffset = '' + offset
      const fileMask = '000000000000'
      const fileName = fileMask.substring(0, fileMask.length - stringOffset.length) + stringOffset + '/' + type
      console.log('send ', fileName, data.length)
      await s3.putObject({
        Bucket: bucket,
        Body: data,
        Key: dir + fileName,
      })
      console.log('sent')
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
    eventEmitter.on('block', async (block, offset) => {
      await saveBlock(block, offset, 'block')
    })
    eventEmitter.on('parentLocator', async (parentLocator, offset) => {
      await saveBlock(parentLocator, offset, 'parentLocator')
    })
    eventEmitter.on('end', () => {
      resolve()
    })
  })
}
