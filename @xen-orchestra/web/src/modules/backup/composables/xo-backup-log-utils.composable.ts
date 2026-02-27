import type { FrontXoBackupLog } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import type { Info, Scale } from 'human-format'
import { useI18n } from 'vue-i18n'

export function useXoBackupLogsUtils() {
  const { d } = useI18n()

  function getBackupLogDate(value: number | undefined) {
    if (value === undefined) {
      return undefined
    }

    return d(value, { dateStyle: 'short', timeStyle: 'medium' })
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

  // TODO: Define the type for task when it becomes available
  const findTransferTaskSize = (tasks: unknown[]): number | undefined => {
    return tasks.reduce((totalSize: number | undefined, task: any) => {
      // TODO: Remove this check after defining the task type
      if (!task || typeof task.message !== 'string' || typeof task.result !== 'object') {
        return totalSize
      }

      if (task.message === 'transfer' && typeof task.result.size === 'number') {
        totalSize = (totalSize ?? 0) + task.result.size
      }

      if (Array.isArray(task.tasks)) {
        const nestedSize = findTransferTaskSize(task.tasks)
        if (nestedSize !== undefined) {
          totalSize = (totalSize ?? 0) + nestedSize
        }
      }

      return totalSize
    }, undefined)
  }

  function getTransferSize(backupLog: FrontXoBackupLog): Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>> | undefined {
    // Recursively search for a task with message === 'transfer'

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
