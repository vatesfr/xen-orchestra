import { getSyncedHandler } from '@xen-orchestra/fs'
import type { FileHandler } from '@xen-orchestra/disk-transform'
import { FullBackupLineage } from './FullDiskLineage.mjs'
import { IBackupLineage } from './DiskLineage.types.mts'

class VmBackupArchive {
  handler: FileHandler
  vmUuid: string
  backupJobUuid: string
  lineages = new Array<IBackupLineage>()

  constructor(handler: FileHandler, vmUuid: string, backupJobUuid: string) {
    this.handler = handler
    this.vmUuid = vmUuid
    this.backupJobUuid = backupJobUuid
    this.lineages.push(new FullBackupLineage(this.handler, this.vmUuid))
  }

  async init(): Promise<void> {
    for (const lineage of this.lineages) {
      await lineage.init()
    }
    await this.check()
  }

  async check() {
    for (const lineage of this.lineages) {
      await lineage.check()
    }
  }

  async clean(): Promise<void> {
    await this.check()
    for (const lineage of this.lineages) {
      await lineage.clean()
    }
  }
}

export { VmBackupArchive }
