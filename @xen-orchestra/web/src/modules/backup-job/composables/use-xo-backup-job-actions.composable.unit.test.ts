import { useBackupJobDelete } from '@/modules/backup-job/composables/use-backup-job-delete.composable.ts'
import { useXoBackupJobActions } from '@/modules/backup-job/composables/use-xo-backup-job-actions.composable.ts'
import { useXoBackupJobChangeStateJob } from '@/modules/backup-job/jobs/xo-backup-job-change-state.job.ts'
import { useXoBackupJobDuplicateJob } from '@/modules/backup-job/jobs/xo-backup-job-duplicate.job.ts'
import { useXoBackupJobRunJob } from '@/modules/backup-job/jobs/xo-backup-job-run.job.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createJobStub, toJobComposableResult } from '@/test/create-job-result.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { t } from '@/test/i18n.ts'
import { scheduleCollectionMock } from '@/test/mock-xo-schedule-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { toValue } from 'vue'

const changeStateJob = createJobStub(useXoBackupJobChangeStateJob)
const runJob = createJobStub(useXoBackupJobRunJob)
const duplicateJob = createJobStub(useXoBackupJobDuplicateJob)
// The composable opens the delete modals and runs the delete job, which calls the REST API
const deleteJob = createJobStub(useBackupJobDelete, result =>
  toJobComposableResult(result, 'deleteBackupJobs', 'isDeletingBackupJobs')
)

mockModule(
  import('@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'),
  () => import('@/test/mock-xo-schedule-collection.ts')
)

const backupJob = createVmBackupJob()

beforeEach(() => {
  changeStateJob.reset()
  runJob.reset()
  duplicateJob.reset()
  deleteJob.reset()
  scheduleCollectionMock.reset()
})

function setSchedulesEnabled(...enabled: boolean[]) {
  scheduleCollectionMock.schedules.value = enabled.map(isEnabled =>
    createSchedule({ jobId: backupJob.id, enabled: isEnabled })
  )
}

function mountActions() {
  return mountComposable(() => useXoBackupJobActions(backupJob)).wrapper.vm
}

// The jobs receive their arguments as getters
function findLastArgs(useJob: ReturnType<typeof vi.fn>) {
  return (useJob.mock.lastCall ?? []).map(arg => toValue(arg))
}

describe('isEnabled', () => {
  it('is enabled when at least one schedule of the backup job is enabled', () => {
    setSchedulesEnabled(false, true)

    expect(mountActions().isEnabled).toBe(true)
  })

  it('is disabled when no schedule of the backup job is enabled', () => {
    setSchedulesEnabled(false)

    expect(mountActions().isEnabled).toBe(false)
  })

  it('is disabled for a backup job without schedule', () => {
    expect(mountActions().isEnabled).toBe(false)
  })
})

describe('changeStateAction', () => {
  it.each([
    { enabled: true, label: 'action:disable', icon: 'action:disable', targetedState: false },
    { enabled: false, label: 'action:enable', icon: 'status:success-circle', targetedState: true },
  ] as const)(
    'targets the opposite state of a backup job with $enabled as state',
    ({ enabled, label, icon, targetedState }) => {
      setSchedulesEnabled(enabled)

      const { changeStateAction } = mountActions()

      expect({ label: changeStateAction.label, icon: changeStateAction.icon }).toEqual({ label: t(label), icon })
      expect(findLastArgs(changeStateJob.use)).toEqual([[backupJob], targetedState])
    }
  )

  it('runs the job on click', () => {
    mountActions().changeStateAction.onClick()

    expect(changeStateJob.run).toHaveBeenCalledOnce()
  })

  it('can run when the job can run', () => {
    expect(mountActions().changeStateAction).toMatchObject({ disabled: false, busy: false, hint: undefined })
  })

  it('is disabled, with the reason as hint, when the job cannot run', () => {
    changeStateJob.setState({ canRun: false, errorMessage: 'no schedule' })

    expect(mountActions().changeStateAction).toMatchObject({ disabled: true, hint: 'no schedule' })
  })

  it('is busy while the job runs', () => {
    changeStateJob.setState({ canRun: false, isRunning: true })

    expect(mountActions().changeStateAction.busy).toBe(true)
  })
})

describe('manualRunAction', () => {
  it('runs the backup job on click', () => {
    const { manualRunAction } = mountActions()

    manualRunAction.onClick()

    expect(manualRunAction).toMatchObject({ label: t('action:manual-run'), icon: 'fa:play' })
    expect(findLastArgs(runJob.use)).toEqual([[backupJob]])
    expect(runJob.run).toHaveBeenCalledOnce()
  })

  it('can run when the job can run', () => {
    expect(mountActions().manualRunAction).toMatchObject({ disabled: false, busy: false, hint: undefined })
  })

  it('is disabled, with the reason as hint, when the job cannot run', () => {
    runJob.setState({ canRun: false, errorMessage: 'already running' })

    expect(mountActions().manualRunAction).toMatchObject({ disabled: true, hint: 'already running' })
  })

  it('is busy while the job runs', () => {
    runJob.setState({ canRun: false, isRunning: true })

    expect(mountActions().manualRunAction.busy).toBe(true)
  })
})

describe('duplicateAction', () => {
  it('duplicates the backup job on click', () => {
    const { duplicateAction } = mountActions()

    duplicateAction.onClick()

    expect(duplicateAction).toMatchObject({ label: t('action:duplicate'), icon: 'action:duplicate' })
    expect(findLastArgs(duplicateJob.use)).toEqual([[backupJob]])
    expect(duplicateJob.run).toHaveBeenCalledOnce()
  })

  it('can run when the job can run', () => {
    expect(mountActions().duplicateAction).toMatchObject({ disabled: false, busy: false, hint: undefined })
  })

  it('is disabled, with the reason as hint, when the job cannot run', () => {
    duplicateJob.setState({ canRun: false, errorMessage: 'in progress' })

    expect(mountActions().duplicateAction).toMatchObject({ disabled: true, hint: 'in progress' })
  })

  it('is busy while the job runs', () => {
    duplicateJob.setState({ canRun: false, isRunning: true })

    expect(mountActions().duplicateAction.busy).toBe(true)
  })
})

describe('deleteAction', () => {
  it('asks to delete the backup job on click, apart from the other actions', () => {
    const { deleteAction } = mountActions()

    deleteAction.onClick()

    expect(deleteAction).toMatchObject({
      label: t('action:delete'),
      icon: 'action:delete',
      accent: 'danger',
      separator: true,
    })
    expect(findLastArgs(deleteJob.use)).toEqual([[backupJob]])
    expect(deleteJob.run).toHaveBeenCalledOnce()
  })

  it('can run when the backup job can be deleted', () => {
    expect(mountActions().deleteAction).toMatchObject({ disabled: false, busy: false, hint: undefined })
  })

  it('is disabled, with the reason as hint, when the backup job cannot be deleted', () => {
    deleteJob.setState({ canRun: false, errorMessage: 'in progress' })

    expect(mountActions().deleteAction).toMatchObject({ disabled: true, hint: 'in progress' })
  })

  it('is busy while the backup job is being deleted', () => {
    deleteJob.setState({ canRun: false, isRunning: true })

    expect(mountActions().deleteAction.busy).toBe(true)
  })
})

describe('moreActions', () => {
  it('lists the change of state, the manual run and the duplication, without the deletion', () => {
    const { moreActions, changeStateAction, manualRunAction, duplicateAction } = mountActions()

    expect(moreActions).toEqual([changeStateAction, manualRunAction, duplicateAction])
  })
})
