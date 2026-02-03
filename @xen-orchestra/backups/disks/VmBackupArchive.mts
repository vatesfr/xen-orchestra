import { getSyncedHandler } from '@xen-orchestra/fs'
import type { FileHandler } from '@xen-orchestra/disk-transform'
import { FullBackupLineage } from './FullDiskLineage.mjs'
import { IBackupLineage } from './DiskLineage.types.mts'

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

export { VmBackupArchive }
