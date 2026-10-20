import { getBackupJobHealthCheckStatus } from '@/modules/backup-job/utils/xo-backup-job.util.ts'
import { createMetadataBackupJob, createMirrorBackupJob, createVmBackupJob } from '@/test/create-backup-job.ts'
import type { XoSchedule, XoSr } from '@vates/types'

const firstScheduleId = 'schedule-1' as XoSchedule['id']
const secondScheduleId = 'schedule-2' as XoSchedule['id']

const healthCheck = { healthCheckVmsWithTags: [], healthCheckSr: 'sr-123' as XoSr['id'] }

describe('getBackupJobHealthCheckStatus', () => {
  it('has no health check status for a metadata job', () => {
    expect(getBackupJobHealthCheckStatus(createMetadataBackupJob())).toBeUndefined()
  })

  it('reports the health check as disabled when no schedule enables it', () => {
    const backupJob = createVmBackupJob({ settings: { '': {}, [firstScheduleId]: { exportRetention: 1 } } })

    expect(getBackupJobHealthCheckStatus(backupJob)).toBe('disabled')
  })

  it('reports the health check as disabled for a job without schedule', () => {
    expect(getBackupJobHealthCheckStatus(createVmBackupJob({ settings: { '': {} } }))).toBe('disabled')
  })

  it('reports the health check as enabled when every schedule enables it', () => {
    const backupJob = createVmBackupJob({
      settings: { '': {}, [firstScheduleId]: healthCheck, [secondScheduleId]: healthCheck },
    })

    expect(getBackupJobHealthCheckStatus(backupJob)).toBe('enabled')
  })

  it('reports the health check as enabled on at least one schedule when only some schedules enable it', () => {
    const backupJob = createVmBackupJob({
      settings: { '': {}, [firstScheduleId]: healthCheck, [secondScheduleId]: { exportRetention: 1 } },
    })

    expect(getBackupJobHealthCheckStatus(backupJob)).toBe('at-least-one-enabled')
  })

  it('considers the health check enabled when it is restricted to some VM tags', () => {
    const backupJob = createVmBackupJob({
      settings: { '': {}, [firstScheduleId]: { ...healthCheck, healthCheckVmsWithTags: ['critical'] } },
    })

    expect(getBackupJobHealthCheckStatus(backupJob)).toBe('enabled')
  })

  it('ignores the general settings of the job', () => {
    const backupJob = createVmBackupJob({ settings: { '': { healthCheckVmsWithTags: [] }, [firstScheduleId]: {} } })

    expect(getBackupJobHealthCheckStatus(backupJob)).toBe('disabled')
  })

  it('reads the health check of the schedules of a mirror job', () => {
    const backupJob = createMirrorBackupJob({
      settings: { '': { reportWhen: 'failure' }, [firstScheduleId]: healthCheck },
    })

    expect(getBackupJobHealthCheckStatus(backupJob)).toBe('enabled')
  })
})
