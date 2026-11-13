import { getBackupJobDuplicatePayload } from '@/modules/backup-job/utils/xo-backup-job-duplicate-payload.util.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import type { XoSchedule } from '@vates/types'

const firstScheduleId = 'schedule-1' as XoSchedule['id']
const secondScheduleId = 'schedule-2' as XoSchedule['id']

describe('getBackupJobDuplicatePayload', () => {
  it('copies the backup job under the new name, without its id', () => {
    const backupJob = createVmBackupJob({
      settings: { '': { reportWhen: 'failure' }, [firstScheduleId]: { exportRetention: 7 } },
    })

    const payload = getBackupJobDuplicatePayload(backupJob, [], 'Copy')

    expect(payload).not.toHaveProperty('id')
    expect(payload).toMatchObject({
      type: backupJob.type,
      mode: backupJob.mode,
      vms: backupJob.vms,
      remotes: backupJob.remotes,
      settings: backupJob.settings,
      name: 'Copy',
    })
  })

  it('leaves out the href sent by the REST API', () => {
    const backupJob = { ...createVmBackupJob(), href: '/rest/v0/backup-jobs/backup-job-123' }

    expect(getBackupJobDuplicatePayload(backupJob, [], 'Copy')).not.toHaveProperty('href')
  })

  it('recreates each schedule under its former id, keeping its state, so the settings follow it', () => {
    const payload = getBackupJobDuplicatePayload(
      createVmBackupJob(),
      [
        createSchedule({
          id: firstScheduleId,
          cron: '0 1 * * *',
          name: 'Nightly',
          timezone: 'Europe/Paris',
          enabled: true,
        }),
        createSchedule({ id: secondScheduleId, cron: '0 2 * * 0', name: 'Weekly', timezone: 'UTC', enabled: false }),
      ],
      'Copy'
    )

    expect(payload.schedules).toEqual({
      [firstScheduleId]: { cron: '0 1 * * *', name: 'Nightly', timezone: 'Europe/Paris', enabled: true },
      [secondScheduleId]: { cron: '0 2 * * 0', name: 'Weekly', timezone: 'UTC', enabled: false },
    })
  })
})
