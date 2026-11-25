import { type EditBackupJobPayload, useXoBackupJobEditJob } from '@/modules/backup-job/jobs/xo-backup-job-edit.job.ts'
import type {
  FrontAnyXoBackupJob,
  FrontXoVmBackupJob,
} from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { VmBackupJobPayload } from '@/modules/backup-job/utils/backup-job-payload.util.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { t } from '@/test/i18n.ts'
import { itCannotRun } from '@/test/job-cases.ts'
import { expectJobRunning } from '@/test/job-running.ts'
import { scheduleCollectionMock, mockXoScheduleCollection } from '@/test/mock-xo-schedule-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'

const patch = mockedExport(fetchPatch)

mockXoScheduleCollection()

beforeEach(() => {
  vi.restoreAllMocks()
  patch.mockResolvedValue(undefined)
  scheduleCollectionMock.reset()
})

const SCHEDULE_ID = 'schedule-1' as FrontXoSchedule['id']

const BACKUP_JOB = createVmBackupJob({
  id: 'backup-job-1' as FrontAnyXoBackupJob['id'],
  settings: {
    '': { backupReportTpl: 'mjml', concurrency: 1 },
    'br-1': { deleteFirst: true },
    [SCHEDULE_ID]: { exportRetention: 1 },
  } as FrontXoVmBackupJob['settings'],
})

function createPayload(overrides: Partial<VmBackupJobPayload> = {}): VmBackupJobPayload {
  return {
    type: 'backup',
    name: 'Renamed backup',
    mode: 'delta',
    compression: undefined,
    proxy: undefined,
    vms: {},
    remotes: '*',
    srs: undefined,
    schedules: { [SCHEDULE_ID]: { cron: '0 3 * * *', timezone: 'Europe/Paris', enabled: false } },
    settings: { '': { concurrency: 2 }, [SCHEDULE_ID]: { exportRetention: 3 } },
    ...overrides,
  }
}

function seedSchedules(count = 1) {
  scheduleCollectionMock.schedules.value = Array.from({ length: count }, (_, index) =>
    createSchedule({
      id: (index === 0 ? SCHEDULE_ID : `schedule-${index + 1}`) as FrontXoSchedule['id'],
      jobId: BACKUP_JOB.id,
    })
  )
}

function mountEditJob(backupJob: FrontAnyXoBackupJob, payload?: EditBackupJobPayload) {
  return mountComposable(() =>
    useXoBackupJobEditJob(
      () => backupJob,
      () => payload
    )
  ).wrapper.vm
}

function getPatchedBackupJob() {
  return patch.mock.calls[0][1] as { settings: Record<string, Record<string, unknown>> }
}

describe('run', () => {
  beforeEach(() => {
    seedSchedules()
  })

  it('patches the backup job, then its schedule', async () => {
    await mountEditJob(BACKUP_JOB, createPayload()).run()

    expect(patch.mock.calls).toEqual([
      [
        `backup-jobs/${BACKUP_JOB.id}`,
        {
          name: 'Renamed backup',
          mode: 'delta',
          vms: {},
          remotes: '*',
          settings: {
            '': { backupReportTpl: 'mjml', concurrency: 2 },
            'br-1': { deleteFirst: true },
            [SCHEDULE_ID]: { exportRetention: 3 },
          },
        },
      ],
      [`schedules/${SCHEDULE_ID}`, { cron: '0 3 * * *', timezone: 'Europe/Paris', enabled: false }],
    ])
  })

  it('sends neither the type nor the schedules to the backup job', async () => {
    await mountEditJob(BACKUP_JOB, createPayload()).run()

    const body = getPatchedBackupJob()

    expect(body).not.toHaveProperty('type')
    expect(body).not.toHaveProperty('schedules')
  })

  it('keeps the settings of the job the form does not manage', async () => {
    await mountEditJob(BACKUP_JOB, createPayload()).run()

    const { settings } = getPatchedBackupJob()

    expect(settings['']).toMatchObject({ backupReportTpl: 'mjml' })
    expect(settings['br-1']).toEqual({ deleteFirst: true })
  })

  it('removes the settings the form left undefined', async () => {
    await mountEditJob(BACKUP_JOB, createPayload({ settings: { '': { concurrency: undefined } } })).run()

    const { settings } = getPatchedBackupJob()

    expect(JSON.parse(JSON.stringify(settings))['']).toEqual({ backupReportTpl: 'mjml' })
  })

  it('does not patch the schedule when the backup job fails', async () => {
    const error = new Error('Invalid parameters')
    patch.mockRejectedValueOnce(error)

    await expect(mountEditJob(BACKUP_JOB, createPayload()).run()).rejects.toBe(error)

    expect(patch).toHaveBeenCalledTimes(1)
  })

  it('refuses to run without payload', async () => {
    await expect(mountEditJob(BACKUP_JOB).run()).rejects.toThrow(t('job:arg:missing-payload'))

    expect(patch).not.toHaveBeenCalled()
  })
})

describe('validate', () => {
  it('can edit a backup job with a single schedule', () => {
    seedSchedules()

    expect(mountEditJob(BACKUP_JOB, createPayload()).canRun).toBe(true)
  })

  it('can edit before the payload exists', () => {
    seedSchedules()

    expect(mountEditJob(BACKUP_JOB).canRun).toBe(true)
  })

  itCannotRun([
    {
      name: 'cannot edit a backup job without schedule',
      mountJob: () => mountEditJob(BACKUP_JOB, createPayload()),
      errorMessage: t('job:backup-job-edit:no-schedule'),
    },
    {
      name: 'cannot edit a backup job with multiple schedules',
      mountJob: () => {
        seedSchedules(2)

        return mountEditJob(BACKUP_JOB, createPayload())
      },
      errorMessage: t('job:backup-job-edit:multiple-schedules'),
    },
  ])

  it('cannot run while the backup job is being edited', () => {
    seedSchedules()
    patch.mockReturnValue(new Promise(() => {}))
    const job = mountEditJob(BACKUP_JOB, createPayload())

    expectJobRunning(job, t('job:edit:in-progress'))
  })
})
