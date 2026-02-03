import { RemoteDisk } from './RemoteDisk.mjs'
import assert from 'node:assert'
import type { FileHandler, FileDescriptor } from '@xen-orchestra/disk-transform'

const COMPRESSED_MAGIC_NUMBERS: Buffer[] = [
  // https://tools.ietf.org/html/rfc1952.html#page-5
  Buffer.from('1F8B', 'hex'),

  // https://github.com/facebook/zstd/blob/dev/doc/zstd_compression_format.md#zstandard-frames
  Buffer.from('28B52FFD', 'hex'),
]

const MAGIC_NUMBER_MAX_LENGTH: number = Math.max(...COMPRESSED_MAGIC_NUMBERS.map(buf => buf.length))

const isCompressedFile = async (handler: FileHandler, fd: FileDescriptor): Promise<boolean> => {
  const header = Buffer.allocUnsafe(MAGIC_NUMBER_MAX_LENGTH)
  assert.strictEqual((await handler.read(fd, header, 0)).bytesRead, header.length)

  for (const magicNumber of COMPRESSED_MAGIC_NUMBERS) {
    if (magicNumber.compare(header, 0, magicNumber.length) === 0) {
      return true
    }
  }
  return false
}

const isValidTar = async (handler: FileHandler, size: number, fd: FileDescriptor): Promise<boolean> => {
  if (size <= 1024 || size % 512 !== 0) {
    return false
  }

  const buf = Buffer.allocUnsafe(1024)
  assert.strictEqual((await handler.read(fd, buf, size - buf.length)).bytesRead, buf.length)
  return buf.every(byte => byte === 0)
}

export async function isValidXva(handler: FileHandler, filePath: string): Promise<boolean> {
  // size is longer when encrypted + reading part of an encrypted file is not implemented
  if (handler.isEncrypted) {
    return true
  }

  try {
    const fd = await handler.openFile(filePath, 'r')
    try {
      const size = await handler.getSize(filePath)
      if (size < 20) {
        // neither a valid gzip nor tar
        return false
      }

      return (await isCompressedFile(handler, fd))
        ? true // compressed files cannot be validated at this time
        : await isValidTar(handler, size, fd)
    } finally {
      handler.closeFile(fd).catch(noop)
    }
  } catch (error) {
    // never throw, log and report as valid to avoid side effects
    return true
  }
}

const noop = (): void => {}

export class FullBackup extends RemoteDisk {
  handler: FileHandler
  xvaPath: string
  checksumPath?: string
  metadataFile?: string
  isValid?: boolean

  // Constructor
  constructor(handler: FileHandler, xvaPath: string) {
    super()
    this.handler = handler
    this.xvaPath = xvaPath
    this.isValid = undefined
  }

  async init() {
    this.check()
  }

  async check() {
    try {
      if (this.isValid == undefined) {
        this.isValid = await isValidXva(this.handler, this.xvaPath)
      }
    } catch (error) {
      this.isValid = false
    }
    return this.isValid
  }

  async clean() {
    try {
      await this.handler.unlink(this.xvaPath)
    } catch (error) {}
  }

  linkMetadata(path: string) {
    this.metadataFile = path
  }

  isLinked() {
    return this.metadataFile !== null
  }
}
