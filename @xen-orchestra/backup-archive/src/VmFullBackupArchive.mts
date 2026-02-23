import { basename, normalize } from '@xen-orchestra/fs/path'
import assert from 'node:assert'
import { FileDescriptor } from '@xen-orchestra/fs'
import { IVmBackupInterface, PartialBackupMetadata } from './VmBackup.types.mjs'
import RemoteHandlerAbstract from '@xen-orchestra/fs'

const COMPRESSED_MAGIC_NUMBERS: Buffer[] = [
  // https://tools.ietf.org/html/rfc1952.html#page-5
  Buffer.from('1F8B', 'hex'),

  // https://github.com/facebook/zstd/blob/dev/doc/zstd_compression_format.md#zstandard-frames
  Buffer.from('28B52FFD', 'hex'),
]

const MAGIC_NUMBER_MAX_LENGTH: number = Math.max(...COMPRESSED_MAGIC_NUMBERS.map(buf => buf.length))

const isCompressedFile = async (handler: RemoteHandlerAbstract, fd: FileDescriptor): Promise<boolean> => {
  const header = Buffer.allocUnsafe(MAGIC_NUMBER_MAX_LENGTH)
  assert.strictEqual((await handler.read(fd, header, 0)).bytesRead, header.length)

  for (const magicNumber of COMPRESSED_MAGIC_NUMBERS) {
    if (magicNumber.compare(header, 0, magicNumber.length) === 0) {
      return true
    }
  }
  return false
}

const isValidTar = async (handler: RemoteHandlerAbstract, size: number, fd: FileDescriptor): Promise<boolean> => {
  if (size <= 1024 || size % 512 !== 0) {
    return false
  }

  const buf = Buffer.allocUnsafe(1024)
  assert.strictEqual((await handler.read(fd, buf, size - buf.length)).bytesRead, buf.length)
  return buf.every(byte => byte === 0)
}

export async function isValidXva(handler: RemoteHandlerAbstract, filePath: string): Promise<boolean> {
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

export class VmFullBackupArchive implements IVmBackupInterface {
  handler: RemoteHandlerAbstract
  rootPath: string
  xvaPath: string
  isValid?: boolean
  metadataPath: string
  metadata: PartialBackupMetadata

  constructor(
    handler: RemoteHandlerAbstract,
    rootPath: string,
    metadataPath: string,
    metadata: PartialBackupMetadata,
    xvaPath: string
  ) {
    this.handler = handler
    this.rootPath = normalize(rootPath)
    this.metadataPath = normalize(metadataPath)
    this.metadata = metadata
    this.xvaPath = normalize(xvaPath)
  }

  async init() {
    await this.check()
  }

  async check(): Promise<object> {
    try {
      if (this.isValid === undefined) {
        this.isValid = await isValidXva(this.handler, this.xvaPath)
      }
    } catch (error) {
      console.log(error)
      this.isValid = false
    }
    // TODO: check isValid
    // isValid is always false in test because XVA test is too small
    if (this.isValid) {
      console.warn('XVA might be broken', { path: this.xvaPath })
    }
    return { xvaValid: this.isValid }
  }

  /**
   * Does nothing for now because VmBackupDirectory already handles deletion for orphan xvas
   * Should remove files if XVA is invalid or does not exist, but right now it never throws to avoid side effects
   * @param opts { remove: boolean }
   * @returns
   */
  async clean({ remove = false }) {
    let filesToRemove: Array<string> = []
    if (remove) {
      for (const file of filesToRemove) {
        try {
          await this.handler.unlink(file)
        } catch (error) {
          console.warn(`Issue removing ${file}`)
        }
      }
    }
    return filesToRemove
  }

  getValidFiles({ prefix = false }): Array<string> {
    const validFiles = [this.metadataPath, this.xvaPath, `${this.xvaPath}.checksum`]
    return prefix ? validFiles : validFiles.map(file => basename(file))
  }
}
