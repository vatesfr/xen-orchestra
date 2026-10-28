import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { formatDateTime } from '@core/utils/time.util.ts'
import type { Info, Scale } from 'human-format'

export type BackupLogTask = NonNullable<FrontXoBackupLog['tasks']>[number] & { message?: string }

type VmTransfer = { size: number; start: number; end: number | undefined }

export function useXoBackupLogsUtils() {
  function getBackupLogDate(value: number): string
  function getBackupLogDate(value: number | undefined): string | undefined
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

  function hasMessage(task: BackupLogTask, message: string) {
    return task.message === message
  }

  // Same as XO5: only the direct `transfer` children of `export` tasks are counted (not the health check restore),
  // and a single transfer per VM, even with multiple targets
  function findVmTransfer(vmTask: BackupLogTask): VmTransfer | undefined {
    for (const exportTask of vmTask.tasks ?? []) {
      if (!hasMessage(exportTask, 'export')) {
        continue
      }

      for (const task of exportTask.tasks ?? []) {
        if (hasMessage(task, 'transfer') && task.status === 'success' && typeof task.result?.size === 'number') {
          return { size: task.result.size, start: task.start, end: task.end }
        }
      }
    }

    return undefined
  }

  function findVmTransferSize(vmTask: BackupLogTask): number | undefined {
    return findVmTransfer(vmTask)?.size
  }

  function findTransferTaskSize(vmTasks: FrontXoBackupLog['tasks']): number | undefined {
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
    const transfers = (backupLog.tasks ?? [])
      .map(vmTask => findVmTransfer(vmTask))
      .filter((transfer): transfer is VmTransfer & { end: number } => transfer?.end !== undefined)

    if (transfers.length === 0) {
      return undefined
    }

    const size = transfers.reduce((totalSize, transfer) => totalSize + transfer.size, 0)
    const start = Math.min(...transfers.map(transfer => transfer.start))
    const end = Math.max(...transfers.map(transfer => transfer.end))

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
