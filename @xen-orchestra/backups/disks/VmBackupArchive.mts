import { getSyncedHandler } from '@xen-orchestra/fs'
import * as path from 'node:path'
import { resolve } from 'node:path'
import assert from 'node:assert'
import type { FileHandler, FileDescriptor } from '@xen-orchestra/disk-transform'
import { FullBackupLineage } from './DiskLineage.mts'
import { IBackupLineage } from './DiskLineage.types.mts'

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

// class DiskLineage {
//   #handler: FileHandler

//   metadata: string[] = []
//   full: Map<string, string> = new Map()
//   delta: Map<string, string[]> = new Map()
//   unlinked: Set<string> = new Set()

//   constructor(handler: FileHandler) {
//     this.#handler = handler
//   }

//   async init(files: string[], vmPath: string): Promise<void> {
//     this.metadata = files.filter(entry => entry.endsWith('.json'))

//     for (const entry of this.metadata) {
//       const metadata: PartialBackupMetadata = JSON.parse(await this.#handler.readFile(entry))
//       const entryBase = path.parse(entry).base

//       if (metadata.mode === 'full') {
//         console.log("TEST", metadata.xva)
//         this.full.set(entryBase, resolve('/', vmPath, metadata.xva!))
//       } else {
//         const vhds = metadata.vhds!
//         this.delta.set(entryBase, Object.keys(vhds).map(key => resolve('/', vmPath, vhds[key])))
//       }
//     }
//   }

//   async check(xvaFiles: Set<string>, checksumFiles: Set<string>): Promise<Set<string>> {
//     this.unlinked = new Set(xvaFiles)
//     console.log(xvaFiles)

//     for (const [jsonPath, xvaPath] of this.full.entries()) {
//       console.log("  ", xvaPath)
//       // keep only unlinked xva to delete them
//       if (xvaFiles.has(xvaPath)) {
//         this.unlinked.delete(xvaPath)
//       // add json if xva missing
//       } else {
//         this.unlinked.add(jsonPath)
//         console.warn('the XVA linked to the backup is missing', { backup: jsonPath, xva: xvaPath })
//       }
//     }

//     for (const [metadata, diskPath] of this.full) {
//       try {
//         if (!(await this.isValidDisk(diskPath))) {
//           console.warn('XVA might be broken', { path: diskPath, backup: metadata })
//         }
//       } catch (error) {
//         console.warn(error, { path: diskPath, backup: metadata })
//       }
//     }

//     for (const filePath of checksumFiles) {
//       this.unlinked.add(filePath)
//     }

//     return this.unlinked
//   }

//   async clean(): Promise<void> {
//     // clean unlinked json, unlinked XVAs and unused checksum
//     // TODO delete all files in one request
//     for (const filePath of this.unlinked) {
//       await this.#handler.unlink(filePath)
//     }
//   }

//   async isValidDisk(diskPath: string): Promise<boolean> {
//     if (diskPath.endsWith('.xva')) {
//       return await isValidXva(this.#handler, diskPath)
//     } else {
//       throw new Error('Disk format not supported')
//     }
//   }
// }

class VmBackupArchive {
  handler: FileHandler
  vmUuid: string
  backupJobUuid: string
  files: string[] = []
  vdis: Map<string, unknown> = new Map()
  vdiChains: Map<string, unknown> = new Map()
  fullBackupLineage: IBackupLineage
  deltaBackupLineage: IBackupLineage

  constructor(handler: FileHandler, vmUuid: string, backupJobUuid: string) {
    this.handler = handler
    this.vmUuid = vmUuid
    this.backupJobUuid = backupJobUuid
    this.fullBackupLineage = new FullBackupLineage(this.handler, this.vmUuid)
  }

  async init(): Promise<void> {
    for (const lineage of [this.fullBackupLineage, this.deltaBackupLineage]) {
      await lineage.init()
    }
    await this.check()
  }

  async check() {
    for (const lineage of [this.fullBackupLineage, this.deltaBackupLineage]) {
      await lineage.check()
    }
  }

  async clean(): Promise<void> {
    await this.check()
    for (const lineage of [this.fullBackupLineage, this.deltaBackupLineage]) {
      await lineage.clean()
    }
  }
}

// const url = "nfs://172.16.211.212:/mnt/data"
// const url = "s3+http://K2UI6IVTXNJAHIZQCUAG:WarCEOguZMA9XRDX6H5srI3zyHdEg4yr5CXpkSYc@10.10.0.102/vateslab?useVhdDirectory=true"
// const url = 'file://tmp/xo-fs-mounts/45ln9qqwkh3'
// const url = "s3+http://test:test@localhost:4566/xo-backups?useVhdDirectory=true"

// const handler = await getSyncedHandler({ url }) as SyncedHandlerResult

// console.log(await handler.value.list("xo-vm-backups/"))
// console.log(await handler.value.tree("xo-vm-backups/"))
// console.log(await handler.value.list("xo-vm-backups/99408233-6887-bb96-6c12-865f7b848798/vdis/43cda9b1-2185-48b6-9704-6665b18e6a66/2252b990-2ff5-45ec-b14a-b10ea3cd17a0"))
// console.log(await handler.value.list("xo-vm-backups/93b88999-8b61-7207-138b-1ef389491e71/vhds/93b88999-8b61-7207-138b-1ef389491e71"))
// const backupArchive = new VmBackupArchive(handler.value, "99408233-6887-bb96-6c12-865f7b848798", "")

// ###############
// const backupArchive = new VmBackupArchive(handler.value, "7b894929-273e-15f4-b7df-88a497d90c14", "")

// await backupArchive.init()
// console.log(await backupArchive.check())

// console.log(backupArchive.vdiChains)
// for(const [entry, diskLineage] of backupArchive.vdiChains) {
//     console.log()
//     console.log(entry, ": ", diskLineage.disks)
// }

export { VmBackupArchive }
