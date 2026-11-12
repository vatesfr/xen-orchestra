import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'

export type BackupLogFilterableData = FrontXoBackupLog & {
  jobName: string | undefined
}

export type BackupLogVmFilterableData = {
  id: FrontXoVm['id']
  name: string
  size: number | undefined
}
