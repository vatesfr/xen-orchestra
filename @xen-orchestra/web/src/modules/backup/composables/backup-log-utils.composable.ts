import { formatSizeRaw } from '@core/utils/size.util.ts'
import type { XoBackupLog } from '@vates/types'
import type { Info, Scale } from 'human-format'
import { useI18n } from 'vue-i18n'

export function useBackupLogsUtils() {
  const { d } = useI18n()

  function getBackupLogDate(value: number | undefined) {
    if (value === undefined) {
      return undefined
    }

    return d(value, { dateStyle: 'short', timeStyle: 'medium' })
  }

  function getBackupLogDuration(backupLog: XoBackupLog) {
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

  const findTransferTask = (tasks: any[]): number | undefined => {
    for (const task of tasks) {
      if (task.message === 'transfer' && task.result?.size !== undefined) {
        return task.result.size
      }

      if (Array.isArray(task.tasks)) {
        const size = findTransferTask(task.tasks)

        if (size !== undefined) {
          return size
        }
      }
    }

    return undefined
  }

  function getTransferSize(backupLog: XoBackupLog): Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>> | undefined {
    // Recursively search for a task with message === 'transfer'

    if (!Array.isArray(backupLog.tasks)) {
      return undefined
    }

    return formatSizeRaw(findTransferTask(backupLog.tasks), 2)
  }

  return {
    getBackupLogDate,
    getBackupLogDuration,
    getTransferSize,
    findTransferTask,
  }
}
