import BackupJobsBulkActions from '@/modules/backup-job/components/list/BackupJobsBulkActions.vue'
import type { useBackupJobDelete } from '@/modules/backup-job/composables/use-backup-job-delete.composable.ts'
import type { useXoBackupJobChangeStateJob } from '@/modules/backup-job/jobs/xo-backup-job-change-state.job.ts'
import type { useXoBackupJobDuplicateJob } from '@/modules/backup-job/jobs/xo-backup-job-duplicate.job.ts'
import type { useXoBackupJobRunJob } from '@/modules/backup-job/jobs/xo-backup-job-run.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { ActionItem, GroupActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsTableBulkActions from '@core/components/table/VtsTableBulkActions.vue'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

type MockedJobState = { canRun?: boolean; isRunning?: boolean; errorMessage?: string }

type ActionName = 'enable' | 'disable' | 'run' | 'duplicate' | 'delete'

const { actions, jobStates } = vi.hoisted(() => ({
  actions: {
    enable: vi.fn(),
    disable: vi.fn(),
    run: vi.fn(),
    duplicate: vi.fn(),
    delete: vi.fn(),
  },
  jobStates: {} as Record<ActionName, MockedJobState>,
}))

function toJobState({ canRun = true, isRunning = false, errorMessage }: MockedJobState = {}) {
  return { canRun: ref(canRun), isRunning: ref(isRunning), errorMessage: ref(errorMessage) }
}

vi.mock(import('@/modules/backup-job/jobs/xo-backup-job-change-state.job.ts'), () => ({
  useXoBackupJobChangeStateJob: ((_backupJobs: unknown, enabled: unknown) =>
    toValue(enabled)
      ? { run: actions.enable, ...toJobState(jobStates.enable) }
      : { run: actions.disable, ...toJobState(jobStates.disable) }) as unknown as typeof useXoBackupJobChangeStateJob,
}))

vi.mock(import('@/modules/backup-job/jobs/xo-backup-job-run.job.ts'), () => ({
  useXoBackupJobRunJob: (() => ({
    run: actions.run,
    ...toJobState(jobStates.run),
  })) as unknown as typeof useXoBackupJobRunJob,
}))

vi.mock(import('@/modules/backup-job/jobs/xo-backup-job-duplicate.job.ts'), () => ({
  useXoBackupJobDuplicateJob: (() => ({
    run: actions.duplicate,
    ...toJobState(jobStates.duplicate),
  })) as unknown as typeof useXoBackupJobDuplicateJob,
}))

vi.mock(import('@/modules/backup-job/composables/use-backup-job-delete.composable.ts'), () => ({
  useBackupJobDelete: (() => {
    const { canRun, isRunning, errorMessage } = toJobState(jobStates.delete)

    return {
      deleteBackupJobs: actions.delete,
      canDeleteBackupJobs: canRun,
      isDeletingBackupJobs: isRunning,
      deleteBackupJobsErrorMessage: errorMessage,
    }
  }) as unknown as typeof useBackupJobDelete,
}))

beforeEach(() => {
  for (const name of Object.keys(actions) as ActionName[]) {
    actions[name].mockReset()
    jobStates[name] = {}
  }
})

function mountBulkActions(backupJobs: FrontAnyXoBackupJob[] = [createVmBackupJob()]) {
  return mount(BackupJobsBulkActions, {
    props: { backupJobs },
    global: createGlobalTestConfig(),
  })
}

function findActions(wrapper: ReturnType<typeof mountBulkActions>) {
  const [changeState, manualRun, duplicate, deleteAction] = wrapper
    .getComponent(VtsTableBulkActions)
    .props('actions') as [GroupActionItem, ActionItem, ActionItem, ActionItem]

  const [enable, disable] = changeState.children

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
  it('disables the change state menu and explains why', () => {
    expect(findActions(mountBulkActions([])).changeState).toMatchObject({
      disabled: true,
      hint: t('no-backup-job-selected'),
    })
  })

  it('explains that no backup job is selected rather than the job error', () => {
    jobStates.run = { canRun: false, errorMessage: 'No backup job to run' }
    jobStates.duplicate = { canRun: false, errorMessage: 'No backup job to duplicate' }
    jobStates.delete = { canRun: false, errorMessage: 'No backup job to delete' }

    const { manualRun, duplicate, deleteAction } = findActions(mountBulkActions([]))

    expect(manualRun).toMatchObject({ disabled: true, hint: t('no-backup-job-selected') })
    expect(duplicate).toMatchObject({ disabled: true, hint: t('no-backup-job-selected') })
    expect(deleteAction).toMatchObject({ disabled: true, hint: t('no-backup-job-selected') })
  })
})

describe('with a selection', () => {
  it('explains why an action cannot run', () => {
    jobStates.run = { canRun: false, errorMessage: t('job:backup-job-run:multiple-schedules', { n: 2 }) }

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

    for (const name of Object.keys(actions) as ActionName[]) {
      expect(actions[name]).toHaveBeenCalledOnce()
    }
  })

  it('shows an action as busy while it runs', () => {
    jobStates.duplicate = { isRunning: true }

    expect(findActions(mountBulkActions()).duplicate.busy).toBe(true)
  })
})
