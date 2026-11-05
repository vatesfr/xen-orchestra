import {
  getBackupLogError,
  getBackupLogSrIds,
  getBackupLogVmIds,
} from '@/modules/backup-log/utils/xo-backup-log.util.ts'
import {
  createBackupLog,
  createBackupLogExportTask,
  createBackupLogSrTask,
  createBackupLogTask,
  createBackupLogVmTask,
} from '@/test/create-backup-log.ts'

const jobError = { message: 'no VMs match this pattern' }
const taskError = { message: 'Disk write error' }

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

describe('getBackupLogError', () => {
  it('has no error for a successful or pending run', () => {
    expect(getBackupLogError(createBackupLog({ status: 'success', result: jobError }))).toBeUndefined()
    expect(getBackupLogError(createBackupLog({ status: 'pending', result: jobError }))).toBeUndefined()
  })

  it('gives the error of the job first', () => {
    const backupLog = createBackupLog({
      status: 'failure',
      result: jobError,
      tasks: [createBackupLogTask({ status: 'failure', result: taskError })],
    })

    expect(getBackupLogError(backupLog)).toEqual(jobError)
  })

  it('looks for the error in the tasks when the job has none', () => {
    const backupLog = createBackupLog({
      status: 'failure',
      tasks: [
        createBackupLogTask({ status: 'success' }),
        createBackupLogTask({
          status: 'failure',
          tasks: [
            createBackupLogTask({
              status: 'failure',
              tasks: [createBackupLogTask({ status: 'failure', result: taskError })],
            }),
          ],
        }),
      ],
    })

    expect(getBackupLogError(backupLog)).toEqual(taskError)
  })

  it('gives the first error found in the tasks', () => {
    const backupLog = createBackupLog({
      status: 'failure',
      tasks: [
        createBackupLogTask({ status: 'failure', result: taskError }),
        createBackupLogTask({ status: 'failure', result: { message: 'Another error' } }),
      ],
    })

    expect(getBackupLogError(backupLog)).toEqual(taskError)
  })

  it('reads the error of an interrupted run from its tasks', () => {
    const backupLog = createBackupLog({
      status: 'interrupted',
      tasks: [createBackupLogTask({ status: 'interrupted', result: taskError })],
    })

    expect(getBackupLogError(backupLog)).toEqual(taskError)
  })

  it('ignores the result of the successful tasks', () => {
    const backupLog = createBackupLog({
      status: 'failure',
      tasks: [createBackupLogTask({ status: 'success', result: { size: 1024 } })],
    })

    expect(getBackupLogError(backupLog)).toBeUndefined()
  })
})
