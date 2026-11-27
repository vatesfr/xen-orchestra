import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'

export type FrontXoVmBackupArchiveDisk = FrontXoVmBackupArchive['disks'][number]

export function getBackupArchiveDiskSize(disk: FrontXoVmBackupArchiveDisk): number | undefined {
  return (disk as FrontXoVmBackupArchiveDisk & { sizeOnDisk?: number }).sizeOnDisk
}

export function getBackupArchiveDisksTotalSize(disks: FrontXoVmBackupArchiveDisk[]): number | undefined {
  const sizes = disks.map(getBackupArchiveDiskSize).filter(size => size !== undefined)

  return sizes.length === 0 ? undefined : sizes.reduce((total, size) => total + size, 0)
}
