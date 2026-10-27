import type { FrontXoBackupLog } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
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

export function getBackupLogRunRoute(backupLog: FrontXoBackupLog): RouteLocationAsRelative | undefined {
  if (backupLog.jobId === undefined) {
    return undefined
  }

  return {
    name: '/backup/[id]/runs',
    params: { id: backupLog.jobId },
    query: { id: backupLog.id },
  }
}
