'use strict'
import stream from 'stream'
import {
  checksumStruct,
  fuFooter,
  VHD_SECTOR_SIZE,
  HARD_DISK_TYPE_FIXED,
  computeGeometryForSize,
} from '@xen-orchestra/vhd-lib'
import { VMDKDirectParser } from './vmdk-read'

const footerCookie = 'conectix'
const creatorApp = 'xo  '
// it looks like everybody is using Wi2k
const WIN2K_OS = 0x5769326b

export function createFooter (size, timestamp, geometry, diskType, dataOffset) {
  const footer = fuFooter.pack({
    cookie: footerCookie,
    features: 2,
    fileFormatVersion: 0x00010000,
    dataOffset,
    timestamp,
    creatorApplication: creatorApp,
    creatorHostOs: WIN2K_OS,
    originalSize: size,
    currentSize: size,
    diskGeometry: geometry,
    diskType,
  })
  checksumStruct(footer, fuFooter)
  return footer
}

export class ReadableRawVHDStream extends stream.Readable {
  constructor (size, vmdkParser) {
    super()
    this.size = size
    const geometry = computeGeometryForSize(size)
    this.footer = createFooter(
      size,
      Math.floor(Date.now() / 1000),
      geometry,
      HARD_DISK_TYPE_FIXED
    )
    this.position = 0
    this.vmdkParser = vmdkParser
    this.done = false
    this.busy = false
    this.currentFile = []
  }

  filePadding (paddingLength) {
    if (paddingLength !== 0) {
      const chunkSize = 1024 * 1024 // 1Mo
      const chunkCount = Math.floor(paddingLength / chunkSize)
      for (let i = 0; i < chunkCount; i++) {
        this.currentFile.push(() => {
          return Buffer.alloc(chunkSize)
        })
      }
      this.currentFile.push(() => {
        return Buffer.alloc(paddingLength % chunkSize)
      })
    }
  }

  async pushNextBlock () {
    const next = await this.vmdkParser.next()
    if (next === null) {
      const paddingLength = this.size - this.position
      this.filePadding(paddingLength)
      this.currentFile.push(() => this.footer)
      this.currentFile.push(() => {
        this.done = true
        return null
      })
    } else {
      const offset = next.lbaBytes
      const buffer = next.grain
      const paddingLength = offset - this.position
      if (paddingLength < 0) {
        process.nextTick(() =>
          this.emit(
            'error',
            'This VMDK file does not have its blocks in the correct order'
          )
        )
      }
      this.filePadding(paddingLength)
      this.currentFile.push(() => buffer)
      this.position = offset + buffer.length
    }
    return this.pushFileUntilFull()
  }

  // returns true if the file is empty
  pushFileUntilFull () {
    while (true) {
      if (this.currentFile.length === 0) {
        break
      }
      const result = this.push(this.currentFile.shift()())
      if (!result) {
        break
      }
    }
    return this.currentFile.length === 0
  }

  async pushNextUntilFull () {
    while (!this.done && (await this.pushNextBlock())) {}
  }

  _read () {
    if (this.busy || this.done) {
      return
    }
    if (this.pushFileUntilFull()) {
      this.busy = true
      this.pushNextUntilFull()
        .then(() => {
          this.busy = false
        })
        .catch(error => {
          process.nextTick(() => this.emit('error', error))
        })
    }
  }
}

export async function convertFromVMDK (vmdkReadStream) {
  const parser = new VMDKDirectParser(vmdkReadStream)
  const header = await parser.readHeader()
  return new ReadableRawVHDStream(
    header.capacitySectors * VHD_SECTOR_SIZE,
    parser
  )
}
