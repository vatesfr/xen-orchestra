import type { FrontXoBackupLog } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import type { XoTask } from '@vates/types'

function findTaskErrorRecursively(tasks: XoTask[]): XoTask['result'] {
  for (const task of tasks) {
    if (task.status !== 'success' && task.status !== 'pending' && task.result !== undefined) {
      return task.result
    }

    const subTaskError = findTaskErrorRecursively(task.tasks ?? [])

    if (subTaskError !== undefined) {
      return subTaskError
    }
  }

  return undefined
}

export function getBackupLogError(backupLog: FrontXoBackupLog): XoTask['result'] {
  switch (backupLog.status) {
    case 'success':
    case 'pending':
      return undefined
    default:
      return (backupLog.result as XoTask['result']) ?? findTaskErrorRecursively(backupLog.tasks ?? [])
  }
}
