import { AnyXoLog, XoBackupLog } from '@vates/types'

export class BackupLogService {
  isBackupLog(log: AnyXoLog): log is XoBackupLog {
    return log.message === 'backup' || log.message === 'metadata'
  }
}
