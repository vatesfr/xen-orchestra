import { useXoBackupLogsUtils } from '@/modules/backup-log/composables/use-xo-backup-log-utils.composable.ts'
import {
  createBackupLog,
  createBackupLogExportTask,
  createBackupLogTask,
  createBackupLogTransferTask,
  createBackupLogVmTask,
} from '@/test/create-backup-log.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { formatDateTime } from '@core/utils/time.util.ts'

function mountBackupLogsUtils() {
  return mountComposable(() => useXoBackupLogsUtils()).wrapper.vm
}

function createVmTaskWithTransfer(vmId: string, transfer: Parameters<typeof createBackupLogTransferTask>[0]) {
  return createBackupLogVmTask(vmId, [createBackupLogExportTask([createBackupLogTransferTask(transfer)])])
}

describe('getBackupLogDate', () => {
  it('formats the date with formatDateTime', () => {
    const { getBackupLogDate } = mountBackupLogsUtils()

    expect(getBackupLogDate(1_700_000_000_000)).toBe(formatDateTime(1_700_000_000_000))
  })

  it('returns undefined without a date', () => {
    const { getBackupLogDate } = mountBackupLogsUtils()

    expect(getBackupLogDate(undefined)).toBeUndefined()
  })
})

describe('getBackupLogDuration', () => {
  it('formats the time between the start and the end of the log as hours, minutes and seconds', () => {
    const { getBackupLogDuration } = mountBackupLogsUtils()

    expect(getBackupLogDuration(createBackupLog({ start: 0, end: 3_723_000 }))).toBe('01:02:03')
  })

  it('returns undefined for a log that has not ended', () => {
    const { getBackupLogDuration } = mountBackupLogsUtils()

    expect(getBackupLogDuration(createBackupLog({ end: undefined }))).toBeUndefined()
  })

  it('returns undefined for a log ending before it starts', () => {
    const { getBackupLogDuration } = mountBackupLogsUtils()

    expect(getBackupLogDuration(createBackupLog({ start: 2_000, end: 1_000 }))).toBeUndefined()
  })
})

describe('findTransferTaskSize', () => {
  it('sums the size transferred by every VM', () => {
    const { findTransferTaskSize } = mountBackupLogsUtils()

    expect(
      findTransferTaskSize([
        createVmTaskWithTransfer('vm-1', { size: 1_000 }),
        createVmTaskWithTransfer('vm-2', { size: 2_000 }),
      ])
    ).toBe(3_000)
  })

  it('counts a single transfer per VM, even with several targets', () => {
    const { findTransferTaskSize } = mountBackupLogsUtils()

    const vmTask = createBackupLogVmTask('vm-1', [
      createBackupLogExportTask([createBackupLogTransferTask({ size: 1_000 })]),
      createBackupLogExportTask([createBackupLogTransferTask({ size: 1_000 })]),
    ])

    expect(findTransferTaskSize([vmTask])).toBe(1_000)
  })

  it('ignores the failed transfers', () => {
    const { findTransferTaskSize } = mountBackupLogsUtils()

    expect(
      findTransferTaskSize([
        createVmTaskWithTransfer('vm-1', { size: 1_000 }),
        createVmTaskWithTransfer('vm-2', { size: 2_000, status: 'failure' }),
      ])
    ).toBe(1_000)
  })

  it('ignores the transfers that are not part of an export, such as the health check', () => {
    const { findTransferTaskSize } = mountBackupLogsUtils()

    const vmTask = createBackupLogVmTask('vm-1', [
      createBackupLogTask({ message: 'health check', tasks: [createBackupLogTransferTask({ size: 5_000 })] }),
      createBackupLogExportTask([createBackupLogTransferTask({ size: 1_000 })]),
    ])

    expect(findTransferTaskSize([vmTask])).toBe(1_000)
  })

  it('returns undefined when no VM transferred anything', () => {
    const { findTransferTaskSize } = mountBackupLogsUtils()

    expect(findTransferTaskSize([createBackupLogVmTask('vm-1')])).toBeUndefined()
  })
})

describe('getTransferSize', () => {
  it('formats the size transferred by the log', () => {
    const { getTransferSize } = mountBackupLogsUtils()

    const backupLog = createBackupLog({
      tasks: [
        createVmTaskWithTransfer('vm-1', { size: 1_048_576 }),
        createVmTaskWithTransfer('vm-2', { size: 1_048_576 }),
      ],
    })

    expect(getTransferSize(backupLog)).toEqual(formatSizeRaw(2_097_152, 2))
  })

  it('returns undefined for a log without transfer', () => {
    const { getTransferSize } = mountBackupLogsUtils()

    expect(getTransferSize(createBackupLog({ tasks: [createBackupLogVmTask('vm-1')] }))).toBeUndefined()
  })

  it('returns undefined for a log without tasks', () => {
    const { getTransferSize } = mountBackupLogsUtils()

    expect(getTransferSize(createBackupLog({ tasks: undefined }))).toBeUndefined()
  })
})

describe('getTransferSpeed', () => {
  it('divides the transferred size by the time the parallel transfers ran together', () => {
    const { getTransferSpeed } = mountBackupLogsUtils()

    const backupLog = createBackupLog({
      tasks: [
        createVmTaskWithTransfer('vm-1', { size: 1_000, start: 0, end: 1_000 }),
        createVmTaskWithTransfer('vm-2', { size: 1_000, start: 0, end: 1_000 }),
      ],
    })

    expect(getTransferSpeed(backupLog)).toBe(2_000)
  })

  it('divides the transferred size by the time from the first transfer to the last one', () => {
    const { getTransferSpeed } = mountBackupLogsUtils()

    const backupLog = createBackupLog({
      tasks: [
        createVmTaskWithTransfer('vm-1', { size: 1_000, start: 0, end: 1_000 }),
        createVmTaskWithTransfer('vm-2', { size: 1_000, start: 1_000, end: 2_000 }),
      ],
    })

    expect(getTransferSpeed(backupLog)).toBe(1_000)
  })

  it('ignores a transfer that has not ended', () => {
    const { getTransferSpeed } = mountBackupLogsUtils()

    const unfinishedTransfer = createBackupLogTask({ message: 'transfer', result: { size: 5_000 }, start: 0 })

    const backupLog = createBackupLog({
      tasks: [
        createVmTaskWithTransfer('vm-1', { size: 1_000, start: 0, end: 1_000 }),
        createBackupLogVmTask('vm-2', [createBackupLogExportTask([unfinishedTransfer])]),
      ],
    })

    expect(getTransferSpeed(backupLog)).toBe(1_000)
  })

  it('returns undefined for a log without transfer', () => {
    const { getTransferSpeed } = mountBackupLogsUtils()

    expect(getTransferSpeed(createBackupLog({ tasks: [createBackupLogVmTask('vm-1')] }))).toBeUndefined()
  })

  it('returns undefined for a log without tasks', () => {
    const { getTransferSpeed } = mountBackupLogsUtils()

    expect(getTransferSpeed(createBackupLog({ tasks: undefined }))).toBeUndefined()
  })

  it('returns undefined when the transfers took no time', () => {
    const { getTransferSpeed } = mountBackupLogsUtils()

    const backupLog = createBackupLog({ tasks: [createVmTaskWithTransfer('vm-1', { size: 1_000, start: 0, end: 0 })] })

    expect(getTransferSpeed(backupLog)).toBeUndefined()
  })
})
