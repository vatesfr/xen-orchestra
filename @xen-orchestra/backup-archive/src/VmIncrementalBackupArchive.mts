import { Disk, DiskChain } from '@xen-orchestra/disk-transform'
import { BackupCleanOptions, IVmBackupInterface, PartialBackupMetadata } from './VmBackup.types.mjs'
import RemoteHandlerAbstract from '@xen-orchestra/fs'
import { normalize } from '@xen-orchestra/fs/path'

export class VmIncrementalBackupArchive implements IVmBackupInterface {
  handler: RemoteHandlerAbstract
  metadataPath: string
  metadata: PartialBackupMetadata
  disks: Map<string, Disk> = new Map()
  diskLineages: Map<string, DiskChain> = new Map() // path, disk
  #diskPaths: Array<string>
  rootPath: string
  opts: BackupCleanOptions

  constructor(
    handler: RemoteHandlerAbstract,
    rootPath: string,
    metadataPath: string,
    metadata: PartialBackupMetadata,
    diskPaths: Array<string>,
    opts: BackupCleanOptions
  ) {
    this.handler = handler
    this.rootPath = normalize(rootPath)
    this.metadataPath = normalize(metadataPath)
    this.metadata = metadata
    this.#diskPaths = diskPaths.map(path => normalize(path))
    this.opts = opts
  }

  async init(): Promise<void> {}

  async check(): Promise<object> {
    return {}
  }

  async clean({ remove = false }): Promise<Array<string>> {
    return []
  }

  getValidFiles({ prefix = false }): Array<string> {
    // all vhds used + folders + alias + json
    return []
  }
}
