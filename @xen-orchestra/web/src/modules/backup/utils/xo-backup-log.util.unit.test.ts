import { getBackupLogSrIds, getBackupLogVmIds } from '@/modules/backup/utils/xo-backup-log.util.ts'
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
