import type { FrontXoBackupLog } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { formatDateTime } from '@core/utils/time.util.ts'
import type { Info, Scale } from 'human-format'

type BackupLogTask = NonNullable<FrontXoBackupLog['tasks']>[number]

export function useXoBackupLogsUtils() {
  function getBackupLogDate(value: number | undefined) {
    if (value === undefined) {
      return undefined
    }

    return formatDateTime(value)
  }

  function getBackupLogDuration(backupLog: FrontXoBackupLog) {
    if (backupLog.end === undefined || backupLog.start === undefined) {
      return undefined
    }

    const durationMs = new Date(backupLog.end).getTime() - new Date(backupLog.start).getTime()

    if (durationMs < 0) {
      return undefined
    }

    const hours = Math.floor(durationMs / 3600000)
    const minutes = Math.floor((durationMs % 3600000) / 60000)
    const seconds = Math.floor((durationMs % 60000) / 1000)

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':')
  }

  const hasMessage = (task: BackupLogTask, message: string) => 'message' in task && task.message === message

  // Same as XO5: only the direct `transfer` children of `export` tasks are counted (not the health check restore),
  // and a single transfer per VM, even with multiple targets
  const findVmTransferSize = (vmTask: BackupLogTask): number | undefined => {
    for (const exportTask of vmTask.tasks ?? []) {
      if (!hasMessage(exportTask, 'export')) {
        continue
      }

      for (const task of exportTask.tasks ?? []) {
        if (hasMessage(task, 'transfer') && task.status === 'success' && typeof task.result?.size === 'number') {
          return task.result.size
        }
      }
    }

    return undefined
  }

  const findTransferTaskSize = (vmTasks: FrontXoBackupLog['tasks']): number | undefined => {
    return vmTasks?.reduce((totalSize: number | undefined, vmTask) => {
      const vmTransferSize = findVmTransferSize(vmTask)

      return vmTransferSize === undefined ? totalSize : (totalSize ?? 0) + vmTransferSize
    }, undefined)
  }

  function getTransferSize(backupLog: FrontXoBackupLog): Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>> | undefined {
    if (!Array.isArray(backupLog.tasks)) {
      return undefined
    }

    return formatSizeRaw(findTransferTaskSize(backupLog.tasks), 2)
  }

  return {
    getBackupLogDate,
    getBackupLogDuration,
    getTransferSize,
    findTransferTaskSize,
  }
}
