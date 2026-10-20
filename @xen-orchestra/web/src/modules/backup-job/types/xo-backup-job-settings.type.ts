import type { FrontXoVmBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'

export type ReportWhen = 'always' | 'failure' | 'error' | 'never'

export type XoBackupReportTemplate = 'compactMjml' | 'mjml'

export type XoBackupJobSettings = Partial<{
  compression: FrontXoVmBackupJob['compression']
  concurrency: number
  maxExportRate: number
  nRetriesVmBackupFailures: number
  backupReportTpl: XoBackupReportTemplate
  reportWhen: ReportWhen
  timeout: number
  checkpointSnapshot: boolean
  offlineBackup: boolean
  offlineSnapshot: boolean
  mergeBackupsSynchronously: boolean
  reportRecipients: string[]
}>
