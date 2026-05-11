import { basename, normalize } from '@xen-orchestra/fs/path'
import assert from 'node:assert'
import { FileDescriptor } from '@xen-orchestra/fs'
import {
  ArchiveCleanOptions,
  CheckResult,
  CleanResult,
  VmBackupInterface,
  PartialBackupMetadata,
  ResolvedBackupCleanOptions,
} from './VmBackup.types.mjs'
import { RemoteHandlerAbstract } from '@xen-orchestra/fs'

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
}

const noop = (): void => {}

export class VmFullBackupArchive implements VmBackupInterface {
  handler: RemoteHandlerAbstract
  rootPath: string
  xvaPath: string
  isValid?: boolean
  missingDisk = false
  metadataPath: string
  metadata: PartialBackupMetadata
  opts: ResolvedBackupCleanOptions

  constructor(
    handler: RemoteHandlerAbstract,
    rootPath: string, // xo-vm-backups/<vmUuid>/
    metadataPath: string, // xo-vm-backups/<vmUuid>/<timestamp>_<scheduleId>.json
    metadata: PartialBackupMetadata,
    xvaPath: string, // xo-vm-backups/<vmUuid>/<timestamp>_<scheduleId>.xva
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

  /**
   * As we are not 100% sure if XVA is valid,
   * we prefer to warn if it is the case but not remove it.
   */
  async check(): Promise<CheckResult> {
    if (this.isValid === undefined) {
      let fileSize,
        checkSumSize = 0
      let validDisk = false
      try {
        fileSize = await this.handler.getSize(this.xvaPath)
        validDisk = await isValidXva(this.handler, this.xvaPath)
      } catch (error) {
        validDisk = false
        if (error?.code === 'ENOENT') {
          this.missingDisk = true
        }
        this.opts.logWarn('Issue while checking XVA', { error })
      }
      try {
        checkSumSize = await this.handler.getSize(`${this.xvaPath}.checksum`)
      } catch (error) {
        this.opts.logWarn('Checksum file not valid, not blocking', { error })
      }
      this.isValid = fileSize > 0 && fileSize === this.metadata.size && validDisk
    }
    if (!this.isValid) {
      this.opts.logWarn('XVA might be broken', { path: this.xvaPath })
    }
    return { isValid: this.isValid }
  }

  async clean({ remove = this.opts.remove ?? false }: ArchiveCleanOptions = {}): Promise<CleanResult> {
    if (this.isValid === undefined) {
      await this.check()
    }
    const removedFiles: string[] = []

    if (!this.isValid && this.missingDisk) {
      removedFiles.push(this.metadataPath, `${this.xvaPath}.checksum`)
    }

    if (remove) {
      if (!this.isValid) {
        if (!this.missingDisk) {
          this.opts.logWarn(`This files may be corrupted but not yet to be removed`, {
            files: this.getAssociatedFiles({ prefix: false }),
          })
        } else {
          for (const file of removedFiles) {
            try {
              await this.handler.unlink(file)
            } catch (error) {
              this.opts.logWarn(`Issue removing ${file}`, { error })
            }
          }
        }
      }
    }

    return { removedFiles, merge: false }
  }

  getAssociatedFiles({ prefix = false }): Array<string> {
    let validFiles = [this.metadataPath, this.xvaPath, `${this.xvaPath}.checksum`]
    return prefix ? validFiles : validFiles.map(file => basename(file))
  }
}
