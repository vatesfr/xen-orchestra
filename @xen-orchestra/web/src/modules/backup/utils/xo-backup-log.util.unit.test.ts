import type { FrontXoBackupLog } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import {
  getBackupLogRunRoute,
  getBackupLogSrIds,
  getBackupLogVmIds,
} from '@/modules/backup/utils/xo-backup-log.util.ts'
import {
  createBackupLog,
  createBackupLogExportTask,
  createBackupLogSrTask,
  createBackupLogTask,
  createBackupLogVmTask,
} from '@/test/create-backup-log.ts'

describe('getBackupLogVmIds', () => {
  it('returns the id of every backed up VM, in order', () => {
    const backupLog = createBackupLog({ tasks: [createBackupLogVmTask('vm-1'), createBackupLogVmTask('vm-2')] })

    expect(getBackupLogVmIds(backupLog)).toEqual(['vm-1', 'vm-2'])
  })

  it('ignores the tasks that are not about a VM', () => {
    const backupLog = createBackupLog({
      tasks: [createBackupLogTask({ data: { type: 'pool', id: 'pool-1' } }), createBackupLogVmTask('vm-1')],
    })

    expect(getBackupLogVmIds(backupLog)).toEqual(['vm-1'])
  })

  it('returns an empty list for a log without tasks', () => {
    expect(getBackupLogVmIds(createBackupLog({ tasks: undefined }))).toEqual([])
  })
})

describe('getBackupLogSrIds', () => {
  it('returns the SR targets of every backed up VM', () => {
    const backupLog = createBackupLog({
      tasks: [
        createBackupLogVmTask('vm-1', [createBackupLogSrTask('sr-1')]),
        createBackupLogVmTask('vm-2', [createBackupLogSrTask('sr-2')]),
      ],
    })

    expect(getBackupLogSrIds(backupLog)).toEqual(['sr-1', 'sr-2'])
  })

  it('lists only once an SR targeted by several VMs', () => {
    const backupLog = createBackupLog({
      tasks: [
        createBackupLogVmTask('vm-1', [createBackupLogSrTask('sr-1')]),
        createBackupLogVmTask('vm-2', [createBackupLogSrTask('sr-1')]),
      ],
    })

    expect(getBackupLogSrIds(backupLog)).toEqual(['sr-1'])
  })

  it('ignores the targets that are not an SR', () => {
    const backupLog = createBackupLog({
      tasks: [
        createBackupLogVmTask('vm-1', [
          createBackupLogTask({ data: { type: 'remote', id: 'br-1' } }),
          createBackupLogExportTask([]),
          createBackupLogSrTask('sr-1'),
        ]),
      ],
    })

    expect(getBackupLogSrIds(backupLog)).toEqual(['sr-1'])
  })

  it('returns an empty list for a log without tasks', () => {
    expect(getBackupLogSrIds(createBackupLog({ tasks: undefined }))).toEqual([])
  })
})

describe('getBackupLogRunRoute', () => {
  it('points to the run of the log in the runs of its job', () => {
    const backupLog = createBackupLog({
      id: 'backup-log-42' as FrontXoBackupLog['id'],
      jobId: 'backup-job-7' as NonNullable<FrontXoBackupLog['jobId']>,
    })

    expect(getBackupLogRunRoute(backupLog)).toEqual({
      name: '/backup/[id]/runs',
      params: { id: 'backup-job-7' },
      query: { id: 'backup-log-42' },
    })
  })

  it('returns undefined for a log without job', () => {
    expect(getBackupLogRunRoute(createBackupLog({ jobId: undefined }))).toBeUndefined()
  })
})
