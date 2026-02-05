import { Disk, DiskChain } from '@xen-orchestra/disk-transform'
import { AbstractVmBackupArchive } from './VmBackupArchive.mts'

export class VmIncrementalBackupArchive extends AbstractVmBackupArchive {
  disks: Map<string, Disk>
  diskLineages: Map<string, DiskChain> // path, disk

  getValidFiles() {
    // all vhds used + folders + alias + json
  }
}
