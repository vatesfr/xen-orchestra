import BackupJobsBulkActions from '@/modules/backup-job/components/list/BackupJobsBulkActions.vue'
import { useBackupJobDelete } from '@/modules/backup-job/composables/use-backup-job-delete.composable.ts'
import type { useXoBackupJobChangeStateJob } from '@/modules/backup-job/jobs/xo-backup-job-change-state.job.ts'
import { useXoBackupJobDuplicateJob } from '@/modules/backup-job/jobs/xo-backup-job-duplicate.job.ts'
import { useXoBackupJobRunJob } from '@/modules/backup-job/jobs/xo-backup-job-run.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { createChangeStateJobStubs, findBulkActions, itExplainsNoSelection } from '@/test/bulk-actions.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createJobStub, toJobComposableResult } from '@/test/create-job-result.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { mount } from '@vue/test-utils'

const changeStateJobs = createChangeStateJobStubs()

const jobs = {
  enable: changeStateJobs.enable,
  disable: changeStateJobs.disable,
  run: createJobStub(useXoBackupJobRunJob),
  duplicate: createJobStub(useXoBackupJobDuplicateJob),
  delete: createJobStub(useBackupJobDelete, result =>
    toJobComposableResult(result, 'deleteBackupJobs', 'isDeletingBackupJobs')
  ),
}

mockModule(import('@/modules/backup-job/jobs/xo-backup-job-change-state.job.ts'), () => ({
  useXoBackupJobChangeStateJob: changeStateJobs.use as unknown as typeof useXoBackupJobChangeStateJob,
}))

beforeEach(() => {
  Object.values(jobs).forEach(job => job.reset())
})

function mountBulkActions(backupJobs: FrontAnyXoBackupJob[] = [createVmBackupJob()]) {
  return mount(BackupJobsBulkActions, {
    props: { backupJobs },
    global: createGlobalTestConfig(),
  })
}

function findActions(wrapper: ReturnType<typeof mountBulkActions>) {
  const {
    changeState,
    changeStateChildren: [enable, disable],
    actions: [manualRun, duplicate, deleteAction],
  } = findBulkActions(wrapper)

  return { changeState, enable, disable, manualRun, duplicate, deleteAction }
}

it('offers to change the state, run, duplicate and delete the selected backup jobs, in this order', () => {
  const { changeState, enable, disable, manualRun, duplicate, deleteAction } = findActions(mountBulkActions())

  expect(changeState.label).toBe(t('action:change-state'))
  expect([enable, disable].map(action => action.label)).toEqual([t('action:enable'), t('action:disable')])
  expect([manualRun, duplicate, deleteAction].map(action => action.label)).toEqual([
    t('action:manual-run'),
    t('action:duplicate'),
    t('action:delete'),
  ])
  expect(deleteAction.accent).toBe('danger')
})

describe('without selection', () => {
  itExplainsNoSelection({
    mountEmpty: () => mountBulkActions([]),
    hint: t('no-backup-job-selected'),
    jobErrors: [
      [jobs.run, 'No backup job to run'],
      [jobs.duplicate, 'No backup job to duplicate'],
      [jobs.delete, 'No backup job to delete'],
    ],
    actionsTestName: 'explains that no backup job is selected rather than the job error',
  })
})

describe('with a selection', () => {
  it('explains why an action cannot run', () => {
    jobs.run.setState({ canRun: false, errorMessage: t('job:backup-job-run:multiple-schedules', { n: 2 }) })

    expect(findActions(mountBulkActions()).manualRun).toMatchObject({
      disabled: true,
      hint: t('job:backup-job-run:multiple-schedules', { n: 2 }),
    })
  })

  it('runs each action on click', () => {
    const { enable, disable, manualRun, duplicate, deleteAction } = findActions(mountBulkActions())

    for (const action of [enable, disable, manualRun, duplicate, deleteAction]) {
      action.onClick?.()
    }

    for (const job of Object.values(jobs)) {
      expect(job.run).toHaveBeenCalledOnce()
    }
  })

  it('shows an action as busy while it runs', () => {
    jobs.duplicate.setState({ isRunning: true })

    expect(findActions(mountBulkActions()).duplicate.busy).toBe(true)
  })
})
