import { useEditBackupJob } from '@/modules/backup-job/composables/use-edit-backup-job.composable.ts'
import { type EditBackupJobPayload, useXoBackupJobEditJob } from '@/modules/backup-job/jobs/xo-backup-job-edit.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { itRunsJobFromDrawer } from '@/test/drawer-job.ts'
import { mockOverlay, overlayMock } from '@/test/mock-overlay.ts'
import { mockXoScheduleCollection, scheduleCollectionMock } from '@/test/mock-xo-schedule-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import type { Ref } from 'vue'

const editJob = createJobStub(useXoBackupJobEditJob)

mockOverlay()
mockXoScheduleCollection()

const PAYLOAD = {
  type: 'backup',
  name: 'Daily backup',
  mode: 'delta',
  schedules: { 'schedule-123': { cron: '0 0 * * *', timezone: 'Europe/Paris', enabled: true } },
  settings: { '': {} },
} as unknown as EditBackupJobPayload

const BACKUP_JOB = createVmBackupJob({ name: 'Daily backup' })

const SCHEDULE = createSchedule({ jobId: BACKUP_JOB.id })

beforeEach(() => {
  editJob.reset()
  overlayMock.reset()
  scheduleCollectionMock.reset()
  scheduleCollectionMock.schedules.value = [SCHEDULE]

  silenceConsoleError()
})

function mountEditBackupJob(backupJob: FrontAnyXoBackupJob = BACKUP_JOB) {
  return mountComposable(() => useEditBackupJob(backupJob)).wrapper.vm
}

function findJobArgs() {
  const [backupJob, payload] = editJob.use.mock.calls[0] as [Ref<FrontAnyXoBackupJob>, Ref<EditBackupJobPayload>]

  return { target: backupJob.value, payload: payload.value }
}

describe('job', () => {
  it('exposes whether the job can be edited, is being edited, and why it cannot be', () => {
    editJob.setState({ canRun: false, isRunning: true, errorMessage: 'Edition in progress' })

    const result = mountEditBackupJob()

    expect(result.canEditBackupJob).toBe(false)
    expect(result.isEditingBackupJob).toBe(true)
    expect(result.editBackupJobErrorMessage).toBe('Edition in progress')
  })
})

describe('editBackupJob', () => {
  it('opens the drawer with the backup job and its schedule', () => {
    mountEditBackupJob().editBackupJob()

    expect(overlayMock.getOverlay().open).toHaveBeenCalledWith({
      props: { backupJob: BACKUP_JOB, schedule: SCHEDULE },
    })
  })

  it('does not open the drawer when the backup job has no schedule', () => {
    scheduleCollectionMock.schedules.value = []

    mountEditBackupJob().editBackupJob()

    expect(overlayMock.getOverlay().open).not.toHaveBeenCalled()
  })

  it('does not open the drawer when the only schedule is the one of another job', () => {
    scheduleCollectionMock.schedules.value = [createSchedule({ jobId: 'other-job' as FrontAnyXoBackupJob['id'] })]

    mountEditBackupJob().editBackupJob()

    expect(overlayMock.getOverlay().open).not.toHaveBeenCalled()
  })
})

describe('drawer', () => {
  itRunsJobFromDrawer({
    subject: 'backup job',
    createTarget: () => createVmBackupJob({ name: 'Nightly backup' }),
    mount: mountEditBackupJob,
    run: editJob.run,
    findJobArgs,
    payload: PAYLOAD,
    errorMessage: 'Edition failed',
  })
})
