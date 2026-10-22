import BackupRepositoriesBulkActions from '@/modules/backup-repository/components/list/BackupRepositoriesBulkActions.vue'
import type { useBackupRepositoryForget } from '@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'
import type { useXoBackupRepositoryBenchmarkJob } from '@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'
import type { useXoBackupRepositoryChangeStateJob } from '@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { ActionItem, GroupActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsTableBulkActions from '@core/components/table/VtsTableBulkActions.vue'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

type MockedJobState = { canRun?: boolean; isRunning?: boolean; errorMessage?: string }

const { connect, disable, benchmark, forget, jobStates } = vi.hoisted(() => ({
  connect: vi.fn(),
  disable: vi.fn(),
  benchmark: vi.fn(),
  forget: vi.fn(),
  jobStates: {} as Record<'connect' | 'disable' | 'benchmark' | 'forget', MockedJobState>,
}))

function toJobState({ canRun = true, isRunning = false, errorMessage }: MockedJobState = {}) {
  return { canRun: ref(canRun), isRunning: ref(isRunning), errorMessage: ref(errorMessage) }
}

// The jobs and the forget composable call the REST API and open SSE subscriptions
vi.mock(import('@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'), () => ({
  useXoBackupRepositoryChangeStateJob: ((_brs: unknown, enabled: unknown) =>
    toValue(enabled)
      ? { run: connect, ...toJobState(jobStates.connect) }
      : { run: disable, ...toJobState(jobStates.disable) }) as unknown as typeof useXoBackupRepositoryChangeStateJob,
}))

vi.mock(import('@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'), () => ({
  useXoBackupRepositoryBenchmarkJob: (() => ({
    run: benchmark,
    ...toJobState(jobStates.benchmark),
  })) as unknown as typeof useXoBackupRepositoryBenchmarkJob,
}))

vi.mock(import('@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'), () => ({
  useBackupRepositoryForget: (() => {
    const { canRun, isRunning, errorMessage } = toJobState(jobStates.forget)

    return {
      forgetBackupRepositories: forget,
      canForgetBackupRepositories: canRun,
      isForgettingBackupRepositories: isRunning,
      forgetBackupRepositoriesErrorMessage: errorMessage,
    }
  }) as unknown as typeof useBackupRepositoryForget,
}))

beforeEach(() => {
  for (const action of [connect, disable, benchmark, forget]) {
    action.mockReset()
  }

  jobStates.connect = {}
  jobStates.disable = {}
  jobStates.benchmark = {}
  jobStates.forget = {}
})

function mountBulkActions(brs: FrontXoBackupRepository[] = [createBr()]) {
  return mount(BackupRepositoriesBulkActions, {
    props: { brs },
    global: createGlobalTestConfig(),
  })
}

function findActions(wrapper: ReturnType<typeof mountBulkActions>) {
  const [changeState, testSpeed, forgetAction] = wrapper.getComponent(VtsTableBulkActions).props('actions') as [
    GroupActionItem,
    ActionItem,
    ActionItem,
  ]

  const [connectAction, disableAction] = changeState.children

  return { changeState, connectAction, disableAction, testSpeed, forgetAction }
}

describe('without selection', () => {
  it('disables the change state menu and explains why', () => {
    const { changeState } = findActions(mountBulkActions([]))

    expect(changeState).toMatchObject({ disabled: true, hint: t('no-br-selected') })
  })

  it('explains why test speed and forget cannot run', () => {
    jobStates.benchmark = { canRun: false, errorMessage: 'Missing backup repository' }
    jobStates.forget = { canRun: false, errorMessage: 'No backup repository to forget' }

    const { testSpeed, forgetAction } = findActions(mountBulkActions([]))

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
    const { connectAction, disableAction, testSpeed, forgetAction } = findActions(mountBulkActions())

    connectAction.onClick()
    disableAction.onClick()
    testSpeed.onClick?.()
    forgetAction.onClick?.()

    expect(connect).toHaveBeenCalledOnce()
    expect(disable).toHaveBeenCalledOnce()
    expect(benchmark).toHaveBeenCalledOnce()
    expect(forget).toHaveBeenCalledOnce()
  })

  it('reflects the state of each job', () => {
    jobStates.connect = { isRunning: true }
    jobStates.disable = { canRun: false, errorMessage: 'Backup repository state change in progress…' }
    jobStates.benchmark = { canRun: false, errorMessage: '2 selected backup repositories are disabled' }
    jobStates.forget = { canRun: false, errorMessage: 'Used by 1 backup job, remove it from the job first' }

    const { connectAction, disableAction, testSpeed, forgetAction } = findActions(mountBulkActions())

    expect(connectAction).toMatchObject({ busy: true, disabled: false })
    expect(disableAction).toMatchObject({ disabled: true, hint: 'Backup repository state change in progress…' })
    expect(testSpeed).toMatchObject({ disabled: true, hint: '2 selected backup repositories are disabled' })
    expect(forgetAction).toMatchObject({
      disabled: true,
      hint: 'Used by 1 backup job, remove it from the job first',
      accent: 'danger',
    })
  })
})
