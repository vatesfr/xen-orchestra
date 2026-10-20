import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { XoTask } from '@vates/types'
import { formatDate } from '@vueuse/core'
import type { RouteLocationAsRelative } from 'vue-router'

function getBackupLogVmTasks(backupLog: FrontXoBackupLog) {
  return (backupLog.tasks ?? []).filter(task => task.data?.type === 'VM')
}

export function getBackupLogVmIds(backupLog: FrontXoBackupLog) {
  return getBackupLogVmTasks(backupLog).map(vmTask => vmTask.data?.id as FrontXoVm['id'])
}

export function getBackupLogSrIds(backupLog: FrontXoBackupLog) {
  return [
    ...new Set(
      getBackupLogVmTasks(backupLog)
        .flatMap(vmTask => vmTask.tasks ?? [])
        .flatMap(task => (task.data?.type === 'SR' ? [task.data.id as FrontXoSr['id']] : []))
    ),
  ]
}

export function formatBackupLogDate(timestamp: number) {
  return formatDate(new Date(timestamp), 'YYYY-MM-DD HH:mm:ss')
}

export function getBackupLogRoute(backupLog: FrontXoBackupLog): RouteLocationAsRelative {
  return {
    name: '/admin/backup-and-replication/logs',
    query: { id: backupLog.id },
  }
}

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
