import { getBackupLogError } from '@/modules/backup-job/utils/xo-backup-log.util.ts'
import { createBackupLog, createBackupLogTask } from '@/test/create-backup-log.ts'

const jobError = { message: 'no VMs match this pattern' }
const taskError = { message: 'Disk write error' }

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
