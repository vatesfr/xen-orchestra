import { PartialBackupMetadata } from './DiskLineage.types.mts'
import RemoteHandlerAbstract from '../../fs/src/abstract'
import { FullBackup } from './FullBackup.mts'
import { basename } from '@xen-orchestra/fs/path'
import { AbstractVmBackupArchive } from './VmBackupArchive.mts'

export class VmFullBackupArchive extends AbstractVmBackupArchive {
  diskPath: string
  backup: FullBackup

  constructor(
    handler: RemoteHandlerAbstract,
    rootPath: string,
    metadataPath: string,
    metadata: PartialBackupMetadata,
    diskPath: string
  ) {
    super(handler, rootPath, metadataPath, metadata)
    this.diskPath = diskPath
    this.backup = new FullBackup(this.handler, this.diskPath)
  }

  async init() {
    const backup = new FullBackup(this.handler, this.diskPath)
    await backup.init()
  }

  getValidFiles({ prefix = false }): Array<string> {
    return prefix ? [this.metadataPath, this.diskPath] : [basename(this.metadataPath), basename(this.diskPath)]
  }
}
