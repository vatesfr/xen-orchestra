import type { useBackupJobDelete } from '@/modules/backup-job/composables/use-backup-job-delete.composable.ts'
import { useXoBackupJobActions } from '@/modules/backup-job/composables/use-xo-backup-job-actions.composable.ts'
import type { useXoBackupJobChangeStateJob } from '@/modules/backup-job/jobs/xo-backup-job-change-state.job.ts'
import type { useXoBackupJobDuplicateJob } from '@/modules/backup-job/jobs/xo-backup-job-duplicate.job.ts'
import type { useXoBackupJobRunJob } from '@/modules/backup-job/jobs/xo-backup-job-run.job.ts'
import type {
  FrontXoSchedule,
  useXoScheduleCollection,
} from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref, toValue } from 'vue'

const {
  useChangeStateJob,
  useRunJob,
  useDuplicateJob,
  useDelete,
  changeState,
  runBackupJobs,
  duplicate,
  deleteBackupJobs,
  schedulesByJobId,
} = vi.hoisted(() => ({
  useChangeStateJob: vi.fn(),
  useRunJob: vi.fn(),
  useDuplicateJob: vi.fn(),
  useDelete: vi.fn(),
  changeState: vi.fn(),
  runBackupJobs: vi.fn(),
  duplicate: vi.fn(),
  deleteBackupJobs: vi.fn(),
  schedulesByJobId: new Map<string, FrontXoSchedule[]>(),
}))

vi.mock(import('@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'), () => ({
  useXoScheduleCollection: (() => ({
    schedulesByJobId: ref(schedulesByJobId),
  })) as unknown as typeof useXoScheduleCollection,
}))

vi.mock(import('@/modules/backup-job/jobs/xo-backup-job-change-state.job.ts'), () => ({
  useXoBackupJobChangeStateJob: useChangeStateJob as unknown as typeof useXoBackupJobChangeStateJob,
}))

vi.mock(import('@/modules/backup-job/jobs/xo-backup-job-run.job.ts'), () => ({
  useXoBackupJobRunJob: useRunJob as unknown as typeof useXoBackupJobRunJob,
}))

vi.mock(import('@/modules/backup-job/jobs/xo-backup-job-duplicate.job.ts'), () => ({
  useXoBackupJobDuplicateJob: useDuplicateJob as unknown as typeof useXoBackupJobDuplicateJob,
}))

// The composable opens the delete modals and runs the delete job, which calls the REST API
vi.mock(import('@/modules/backup-job/composables/use-backup-job-delete.composable.ts'), () => ({
  useBackupJobDelete: useDelete as unknown as typeof useBackupJobDelete,
}))

const backupJob = createVmBackupJob()

beforeEach(() => {
  useChangeStateJob.mockReset()
  useRunJob.mockReset()
  useDuplicateJob.mockReset()
  useDelete.mockReset()
  changeState.mockReset()
  runBackupJobs.mockReset()
  duplicate.mockReset()
  deleteBackupJobs.mockReset()
  schedulesByJobId.clear()

  useChangeStateJob.mockReturnValue(createJobResult(changeState))
  useRunJob.mockReturnValue(createJobResult(runBackupJobs))
  useDuplicateJob.mockReturnValue(createJobResult(duplicate))
  mockDelete()
})

function mockDelete(state: Parameters<typeof createJobResult>[1] = {}) {
  const { run, canRun, isRunning, errorMessage } = createJobResult(deleteBackupJobs, state)

  useDelete.mockReturnValue({
    deleteBackupJobs: run,
    canDeleteBackupJobs: canRun,
    isDeletingBackupJobs: isRunning,
    deleteBackupJobsErrorMessage: errorMessage,
  })
}

function setSchedulesEnabled(...enabled: boolean[]) {
  schedulesByJobId.set(
    backupJob.id,
    enabled.map(isEnabled => createSchedule({ jobId: backupJob.id, enabled: isEnabled }))
  )
}

function mountActions() {
  return mountComposable(() => useXoBackupJobActions(backupJob)).wrapper.vm
}

// The jobs receive their arguments as getters
function findLastArgs(useJob: typeof useChangeStateJob) {
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
      expect(findLastArgs(useChangeStateJob)).toEqual([[backupJob], targetedState])
    }
  )

  it('runs the job on click', () => {
    mountActions().changeStateAction.onClick()

    expect(changeState).toHaveBeenCalledOnce()
  })

  it('can run when the job can run', () => {
    expect(mountActions().changeStateAction).toMatchObject({ disabled: false, busy: false, hint: undefined })
  })

  it('is disabled, with the reason as hint, when the job cannot run', () => {
    useChangeStateJob.mockReturnValue(createJobResult(changeState, { canRun: false, errorMessage: 'no schedule' }))

    expect(mountActions().changeStateAction).toMatchObject({ disabled: true, hint: 'no schedule' })
  })

  it('is busy while the job runs', () => {
    useChangeStateJob.mockReturnValue(createJobResult(changeState, { canRun: false, isRunning: true }))

    expect(mountActions().changeStateAction.busy).toBe(true)
  })
})

describe('manualRunAction', () => {
  it('runs the backup job on click', () => {
    const { manualRunAction } = mountActions()

    manualRunAction.onClick()

    expect(manualRunAction).toMatchObject({ label: t('action:manual-run'), icon: 'fa:play' })
    expect(findLastArgs(useRunJob)).toEqual([[backupJob]])
    expect(runBackupJobs).toHaveBeenCalledOnce()
  })

  it('can run when the job can run', () => {
    expect(mountActions().manualRunAction).toMatchObject({ disabled: false, busy: false, hint: undefined })
  })

  it('is disabled, with the reason as hint, when the job cannot run', () => {
    useRunJob.mockReturnValue(createJobResult(runBackupJobs, { canRun: false, errorMessage: 'already running' }))

    expect(mountActions().manualRunAction).toMatchObject({ disabled: true, hint: 'already running' })
  })

  it('is busy while the job runs', () => {
    useRunJob.mockReturnValue(createJobResult(runBackupJobs, { canRun: false, isRunning: true }))

    expect(mountActions().manualRunAction.busy).toBe(true)
  })
})

describe('duplicateAction', () => {
  it('duplicates the backup job on click', () => {
    const { duplicateAction } = mountActions()

    duplicateAction.onClick()

    expect(duplicateAction).toMatchObject({ label: t('action:duplicate'), icon: 'action:duplicate' })
    expect(findLastArgs(useDuplicateJob)).toEqual([[backupJob]])
    expect(duplicate).toHaveBeenCalledOnce()
  })

  it('can run when the job can run', () => {
    expect(mountActions().duplicateAction).toMatchObject({ disabled: false, busy: false, hint: undefined })
  })

  it('is disabled, with the reason as hint, when the job cannot run', () => {
    useDuplicateJob.mockReturnValue(createJobResult(duplicate, { canRun: false, errorMessage: 'in progress' }))

    expect(mountActions().duplicateAction).toMatchObject({ disabled: true, hint: 'in progress' })
  })

  it('is busy while the job runs', () => {
    useDuplicateJob.mockReturnValue(createJobResult(duplicate, { canRun: false, isRunning: true }))

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
    expect(findLastArgs(useDelete)).toEqual([[backupJob]])
    expect(deleteBackupJobs).toHaveBeenCalledOnce()
  })

  it('can run when the backup job can be deleted', () => {
    expect(mountActions().deleteAction).toMatchObject({ disabled: false, busy: false, hint: undefined })
  })

  it('is disabled, with the reason as hint, when the backup job cannot be deleted', () => {
    mockDelete({ canRun: false, errorMessage: 'in progress' })

    expect(mountActions().deleteAction).toMatchObject({ disabled: true, hint: 'in progress' })
  })

  it('is busy while the backup job is being deleted', () => {
    mockDelete({ canRun: false, isRunning: true })

    expect(mountActions().deleteAction.busy).toBe(true)
  })
})

describe('moreActions', () => {
  it('lists the change of state, the manual run and the duplication, without the deletion', () => {
    const { moreActions, changeStateAction, manualRunAction, duplicateAction } = mountActions()

    expect(moreActions).toEqual([changeStateAction, manualRunAction, duplicateAction])
  })
})
