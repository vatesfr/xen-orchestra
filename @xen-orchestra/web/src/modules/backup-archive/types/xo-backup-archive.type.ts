import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'

export type VmBackupArchiveFilterableData = FrontXoVmBackupArchive & {
  vmName: string
  backupRepositoryName: string | undefined
  tags: string[]
}
