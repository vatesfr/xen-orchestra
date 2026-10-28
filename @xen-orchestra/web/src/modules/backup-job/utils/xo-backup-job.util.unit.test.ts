import {
  getBackupJobHealthCheckSrIds,
  getBackupJobHealthCheckStatus,
  hasBackupJobSnapshotRetention,
} from '@/modules/backup-job/utils/xo-backup-job.util.ts'
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

describe('getBackupJobHealthCheckSrIds', () => {
  it('has no health check SR for a metadata job', () => {
    expect(getBackupJobHealthCheckSrIds(createMetadataBackupJob())).toEqual([])
  })

  it('lists the health check SR of each schedule enabling the health check, once', () => {
    const backupJob = createVmBackupJob({
      settings: {
        '': {},
        [firstScheduleId]: healthCheck,
        [secondScheduleId]: { ...healthCheck, healthCheckSr: 'sr-456' as XoSr['id'] },
        ['schedule-3' as XoSchedule['id']]: healthCheck,
      },
    })

    expect(getBackupJobHealthCheckSrIds(backupJob)).toEqual(['sr-123', 'sr-456'])
  })

  it('ignores the SR of a schedule not enabling the health check', () => {
    const backupJob = createVmBackupJob({
      settings: { '': {}, [firstScheduleId]: { healthCheckSr: 'sr-123' as XoSr['id'] } },
    })

    expect(getBackupJobHealthCheckSrIds(backupJob)).toEqual([])
  })
})

describe('hasBackupJobSnapshotRetention', () => {
  it('detects a schedule keeping snapshots', () => {
    const backupJob = createVmBackupJob({
      settings: { '': {}, [firstScheduleId]: { snapshotRetention: 0 }, [secondScheduleId]: { snapshotRetention: 2 } },
    })

    expect(hasBackupJobSnapshotRetention(backupJob)).toBe(true)
  })

  it('does not detect snapshots when no schedule keeps any', () => {
    const backupJob = createVmBackupJob({
      settings: { '': {}, [firstScheduleId]: { snapshotRetention: 0 }, [secondScheduleId]: { exportRetention: 1 } },
    })

    expect(hasBackupJobSnapshotRetention(backupJob)).toBe(false)
  })
})
