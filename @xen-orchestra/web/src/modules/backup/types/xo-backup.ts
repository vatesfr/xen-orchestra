import type { FrontXoVmBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import type { XoProxy } from '@vates/types'

export type ReportWhen = 'always' | 'failure' | 'error' | 'never'

export type XoBackupReportTemplate = 'compactMjml' | 'mjml'

export type XoBackupJobSettings = Partial<{
  compression: FrontXoVmBackupJob['compression']
  proxy: XoProxy['id']
  preferNbd: boolean
  cbtDestroySnapshotData: boolean
  concurrency: number
  nbdConcurrency: number
  maxExportRate: number
  nRetriesVmBackupFailures: number
  hideSuccessfulItems: boolean
  backupReportTpl: XoBackupReportTemplate
  reportWhen: ReportWhen
  timeout: number
  checkpointSnapshot: boolean
  offlineBackup: boolean
  offlineSnapshot: boolean
  mergeBackupsSynchronously: boolean
  timezone: string
  reportRecipients: string[]
  other: Record<string, unknown>
}>
