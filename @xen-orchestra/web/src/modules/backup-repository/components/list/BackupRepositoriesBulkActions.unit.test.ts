import BackupRepositoriesBulkActions from '@/modules/backup-repository/components/list/BackupRepositoriesBulkActions.vue'
import { useBackupRepositoryForget } from '@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'
import { useBulkEditBackupRepositories } from '@/modules/backup-repository/composables/use-bulk-edit-backup-repositories.composable.ts'
import type { useXoBackupRepositoryChangeStateJob } from '@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createJobStub, toJobComposableResult } from '@/test/create-job-result.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { benchmarkJobMock } from '@/test/mock-backup-repository-benchmark-job.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import type { ActionItem, GroupActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsTableBulkActions from '@core/components/table/VtsTableBulkActions.vue'
import { mount } from '@vue/test-utils'
import { toValue } from 'vue'

const jobs = {
  connect: createJobStub(),
  disable: createJobStub(),
  edit: createJobStub(useBulkEditBackupRepositories, result =>
    toJobComposableResult(result, 'editBackupRepositories', 'isEditingBackupRepositories')
  ),
  benchmark: benchmarkJobMock,
  forget: createJobStub(useBackupRepositoryForget, result =>
    toJobComposableResult(result, 'forgetBackupRepositories', 'isForgettingBackupRepositories')
  ),
}

// The jobs and the edit and forget composables call the REST API and open SSE subscriptions
mockModule(import('@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'), () => ({
  useXoBackupRepositoryChangeStateJob: ((_brs: unknown, enabled: unknown) =>
    toValue(enabled)
      ? jobs.connect.use()
      : jobs.disable.use()) as unknown as typeof useXoBackupRepositoryChangeStateJob,
}))

beforeEach(() => {
  Object.values(jobs).forEach(job => job.reset())
})

function mountBulkActions(brs: FrontXoBackupRepository[] = [createBr()]) {
  return mount(BackupRepositoriesBulkActions, {
    props: { brs },
    global: createGlobalTestConfig(),
  })
}

function findActions(wrapper: ReturnType<typeof mountBulkActions>) {
  const [changeState, editAction, testSpeed, forgetAction] = wrapper
    .getComponent(VtsTableBulkActions)
    .props('actions') as [GroupActionItem, ActionItem, ActionItem, ActionItem]

  const [connectAction, disableAction] = changeState.children

  return { changeState, connectAction, disableAction, editAction, testSpeed, forgetAction }
}

describe('without selection', () => {
  it('disables the change state menu and explains why', () => {
    const { changeState } = findActions(mountBulkActions([]))

    expect(changeState).toMatchObject({ disabled: true, hint: t('no-br-selected') })
  })

  it('explains why edit, test speed and forget cannot run', () => {
    jobs.edit.setState({ canRun: false, errorMessage: 'No backup repository to edit' })
    jobs.benchmark.setState({ canRun: false, errorMessage: 'Missing backup repository' })
    jobs.forget.setState({ canRun: false, errorMessage: 'No backup repository to forget' })

    const { editAction, testSpeed, forgetAction } = findActions(mountBulkActions([]))

    expect(editAction).toMatchObject({ disabled: true, hint: t('no-br-selected') })
    expect(testSpeed).toMatchObject({ disabled: true, hint: t('no-br-selected') })
    expect(forgetAction).toMatchObject({ disabled: true, hint: t('no-br-selected') })
  })
})

describe('with a selection', () => {
  it('enables the change state menu', () => {
    const { changeState } = findActions(mountBulkActions())

    expect(changeState).toMatchObject({ disabled: false, hint: undefined })
  })

  it('runs the matching job for each action', () => {
    const { connectAction, disableAction, editAction, testSpeed, forgetAction } = findActions(mountBulkActions())

    connectAction.onClick()
    disableAction.onClick()
    editAction.onClick?.()
    testSpeed.onClick?.()
    forgetAction.onClick?.()

    expect(jobs.connect.run).toHaveBeenCalledOnce()
    expect(jobs.disable.run).toHaveBeenCalledOnce()
    expect(jobs.edit.run).toHaveBeenCalledOnce()
    expect(jobs.benchmark.run).toHaveBeenCalledOnce()
    expect(jobs.forget.run).toHaveBeenCalledOnce()
  })

  it('reflects the state of each job', () => {
    jobs.connect.setState({ isRunning: true })
    jobs.disable.setState({ canRun: false, errorMessage: 'Backup repository state change in progress…' })
    jobs.edit.setState({ canRun: false, isRunning: true, errorMessage: 'Backup repositories edition in progress…' })
    jobs.benchmark.setState({ canRun: false, errorMessage: '2 selected backup repositories are disabled' })
    jobs.forget.setState({ canRun: false, errorMessage: 'Used by 1 backup job, remove it from the job first' })

    const { connectAction, disableAction, editAction, testSpeed, forgetAction } = findActions(mountBulkActions())

    expect(connectAction).toMatchObject({ busy: true, disabled: false })
    expect(disableAction).toMatchObject({ disabled: true, hint: 'Backup repository state change in progress…' })
    expect(editAction).toMatchObject({ busy: true, disabled: true, hint: 'Backup repositories edition in progress…' })
    expect(testSpeed).toMatchObject({ disabled: true, hint: '2 selected backup repositories are disabled' })
    expect(forgetAction).toMatchObject({
      disabled: true,
      hint: 'Used by 1 backup job, remove it from the job first',
      accent: 'danger',
    })
  })
})
