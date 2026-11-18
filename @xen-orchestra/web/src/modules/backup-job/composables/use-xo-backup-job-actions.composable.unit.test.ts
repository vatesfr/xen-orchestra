import { useBackupJobDelete } from '@/modules/backup-job/composables/use-backup-job-delete.composable.ts'
import { useXoBackupJobActions } from '@/modules/backup-job/composables/use-xo-backup-job-actions.composable.ts'
import { useXoBackupJobChangeStateJob } from '@/modules/backup-job/jobs/xo-backup-job-change-state.job.ts'
import { useXoBackupJobDuplicateJob } from '@/modules/backup-job/jobs/xo-backup-job-duplicate.job.ts'
import { useXoBackupJobRunJob } from '@/modules/backup-job/jobs/xo-backup-job-run.job.ts'
import { itRunsJobFromAction } from '@/test/action-item-job.ts'
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

  itRunsJobFromAction({
    getAction: () => mountActions().changeStateAction,
    setJobState: changeStateJob.setState,
    errorMessage: 'no schedule',
    click: { run: changeStateJob.run },
  })
})

const JOB_ACTIONS = [
  {
    action: 'manualRunAction',
    job: runJob,
    clickCase: 'runs the backup job on click',
    item: { label: 'action:manual-run', icon: 'fa:play' },
    errorMessage: 'already running',
  },
  {
    action: 'duplicateAction',
    job: duplicateJob,
    clickCase: 'duplicates the backup job on click',
    item: { label: 'action:duplicate', icon: 'action:duplicate' },
    errorMessage: 'in progress',
  },
  {
    action: 'deleteAction',
    job: deleteJob,
    clickCase: 'asks to delete the backup job on click, apart from the other actions',
    item: { label: 'action:delete', icon: 'action:delete', accent: 'danger', separator: true },
    errorMessage: 'in progress',
  },
] as const

// Not `describe.each`: its `$action` would quote the name
for (const { action, job, clickCase, item, errorMessage } of JOB_ACTIONS) {
  describe(action, () => {
    it(clickCase, () => {
      const actionItem = mountActions()[action]

      actionItem.onClick()

      expect(actionItem).toMatchObject({ ...item, label: t(item.label) })
      expect(findLastArgs(job.use)).toEqual([[backupJob]])
      expect(job.run).toHaveBeenCalledOnce()
    })

    itRunsJobFromAction({ getAction: () => mountActions()[action], setJobState: job.setState, errorMessage })
  })
}

describe('moreActions', () => {
  it('lists the change of state, the manual run and the duplication, without the deletion', () => {
    const { moreActions, changeStateAction, manualRunAction, duplicateAction } = mountActions()

    expect(moreActions).toEqual([changeStateAction, manualRunAction, duplicateAction])
  })
})
