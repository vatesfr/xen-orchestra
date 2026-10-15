import type { FrontXoBackupLog } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import type { XoTask } from '@vates/types'

export type BackupLogTask = XoTask & { message?: string }

/**
 * Builds a fully-populated `FrontXoBackupLog` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createBackupLog(overrides: Partial<FrontXoBackupLog> = {}): FrontXoBackupLog {
  return {
    id: 'backup-log-123' as FrontXoBackupLog['id'],
    jobId: 'backup-job-456' as NonNullable<FrontXoBackupLog['jobId']>,
    status: 'success',
    start: 1_700_000_000_000,
    end: 1_700_000_014_000,
    tasks: [],
    ...overrides,
  }
}

export function createBackupLogTask(overrides: Partial<BackupLogTask> = {}): BackupLogTask {
  return {
    id: 'task-123' as XoTask['id'],
    properties: {},
    start: 1_700_000_000_000,
    status: 'success',
    ...overrides,
  }
}

export function createBackupLogVmTask(vmId: string, tasks: BackupLogTask[] = []): BackupLogTask {
  return createBackupLogTask({ message: 'backup VM', data: { type: 'VM', id: vmId }, tasks })
}

export function createBackupLogSrTask(srId: string): BackupLogTask {
  return createBackupLogTask({ message: 'export', data: { type: 'SR', id: srId } })
}

export function createBackupLogExportTask(tasks: BackupLogTask[]): BackupLogTask {
  return createBackupLogTask({ message: 'export', tasks })
}

export function createBackupLogTransferTask({
  size,
  start = 1_700_000_000_000,
  end = start + 1_000,
  status = 'success',
}: {
  size: number
  start?: number
  end?: number
  status?: BackupLogTask['status']
}): BackupLogTask {
  return createBackupLogTask({ message: 'transfer', result: { size }, start, end, status })
}
