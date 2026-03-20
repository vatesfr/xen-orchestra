import { basename, normalize } from '@xen-orchestra/fs/path'
import assert from 'node:assert'
import { FileDescriptor } from '@xen-orchestra/fs'
import {
  ArchiveCleanOptions,
  CheckResult,
  VmBackupInterface,
  PartialBackupMetadata,
  ResolvedBackupCleanOptions,
} from './VmBackup.types.mjs'
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

export class VmFullBackupArchive implements VmBackupInterface {
  handler: RemoteHandlerAbstract
  rootPath: string
  xvaPath: string
  isValid?: boolean
  metadataPath: string
  metadata: PartialBackupMetadata
  opts: ResolvedBackupCleanOptions

  constructor(
    handler: RemoteHandlerAbstract,
    rootPath: string,
    metadataPath: string,
    metadata: PartialBackupMetadata,
    xvaPath: string,
    opts: ResolvedBackupCleanOptions
  ) {
    this.handler = handler
    this.rootPath = normalize(rootPath)
    this.metadataPath = normalize(metadataPath)
    this.metadata = metadata
    this.xvaPath = normalize(xvaPath)
    this.opts = opts
  }

  async init() {}

  async check(): Promise<CheckResult> {
    try {
      if (this.isValid === undefined) {
        this.isValid = await isValidXva(this.handler, this.xvaPath)
      }
    } catch (error) {
      this.opts.logWarn(error)
      this.isValid = false
    }
    if (!this.isValid) {
      this.opts.logWarn('XVA might be broken', { path: this.xvaPath })
    }
    return { isValid: this.isValid! }
  }

  /**
   * Does nothing for now because VmBackupDirectory already handles deletion for orphan xvas
   * Should remove files if XVA is invalid or does not exist, but right now it never throws to avoid side effects
   * @param opts { remove: boolean }
   * @returns
   */
  async clean({ remove = this.opts.remove ?? false }: ArchiveCleanOptions = {}) {
    await this.check()
    let filesToRemove: Array<string> = []
    if (!this.isValid) {
      filesToRemove = [this.metadataPath, this.xvaPath, `${this.xvaPath}.checksum`]
    }
    if (remove) {
      for (const file of filesToRemove) {
        try {
          await this.handler.unlink(file)
        } catch (error) {
          this.opts.logWarn(`Issue removing ${file}`)
        }
      }
    }
    return filesToRemove
  }

  getAssociatedFiles({ prefix = false }): Array<string> {
    let validFiles = [this.metadataPath, this.xvaPath, `${this.xvaPath}.checksum`]
    if (!this.isValid) {
      validFiles = []
    }
    return prefix ? validFiles : validFiles.map(file => basename(file))
  }
}
