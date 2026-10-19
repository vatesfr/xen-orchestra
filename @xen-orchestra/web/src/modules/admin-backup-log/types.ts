import type { FrontXoBackupLog } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'

export type BackupLogFilterableData = FrontXoBackupLog & {
  jobName: string | undefined
}
