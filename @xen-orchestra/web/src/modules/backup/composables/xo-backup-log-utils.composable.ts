import type { FrontXoBackupLog } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import type { Info, Scale } from 'human-format'
import { useI18n } from 'vue-i18n'

type BackupLogTask = NonNullable<FrontXoBackupLog['tasks']>[number]

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

  const hasMessage = (task: BackupLogTask, message: string) => 'message' in task && task.message === message

  // Same as XO5: only the direct `transfer` children of `export` tasks are counted (not the health check restore),
  // and a single transfer per VM, even with multiple targets
  const findVmTransferTask = (vmTask: BackupLogTask): BackupLogTask | undefined => {
    for (const exportTask of vmTask.tasks ?? []) {
      if (!hasMessage(exportTask, 'export')) {
        continue
      }

      for (const task of exportTask.tasks ?? []) {
        if (hasMessage(task, 'transfer') && task.status === 'success' && typeof task.result?.size === 'number') {
          return task
        }
      }
    }

    return undefined
  }

  const findVmTransferSize = (vmTask: BackupLogTask): number | undefined =>
    findVmTransferTask(vmTask)?.result?.size as number | undefined

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

  // Total transferred size divided by the time between the start of the first transfer and the end of the last one,
  // so that parallel transfers are not counted twice
  function getTransferSpeed(backupLog: FrontXoBackupLog): number | undefined {
    const transferTasks = (backupLog.tasks ?? [])
      .map(vmTask => findVmTransferTask(vmTask))
      .filter((task): task is BackupLogTask & { end: number } => task?.end !== undefined)

    if (transferTasks.length === 0) {
      return undefined
    }

    const size = transferTasks.reduce((totalSize, task) => totalSize + (task.result!.size as number), 0)
    const start = Math.min(...transferTasks.map(task => task.start))
    const end = Math.max(...transferTasks.map(task => task.end))

    if (end <= start) {
      return undefined
    }

    return (size * 1000) / (end - start)
  }

  return {
    getBackupLogDate,
    getBackupLogDuration,
    getTransferSize,
    findTransferTaskSize,
    getTransferSpeed,
  }
}
