import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import type { XoConfigBackupArchive, XoPoolBackupArchive } from '@vates/types'

export type VmBackupArchiveFilterableData = FrontXoVmBackupArchive & {
  vmName: string
  backupRepositoryName: string | undefined
}

export type ConfigBackupArchiveFilterableData = XoConfigBackupArchive & {
  backupRepositoryName: string | undefined
}

export type PoolBackupArchiveFilterableData = XoPoolBackupArchive & {
  poolName: string
  backupRepositoryName: string | undefined
}
