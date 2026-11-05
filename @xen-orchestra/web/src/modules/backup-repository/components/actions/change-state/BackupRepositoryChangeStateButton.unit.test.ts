import BackupRepositoryChangeStateButton from '@/modules/backup-repository/components/actions/change-state/BackupRepositoryChangeStateButton.vue'
import type { useXoBackupRepositoryChangeStateJob } from '@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

const { useChangeStateJob, run } = vi.hoisted(() => ({
  useChangeStateJob: vi.fn(),
  run: vi.fn(),
}))

// The job patches the repositories through the REST API
vi.mock(import('@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'), () => ({
  useXoBackupRepositoryChangeStateJob: useChangeStateJob as unknown as typeof useXoBackupRepositoryChangeStateJob,
}))

beforeEach(() => {
  useChangeStateJob.mockReset()
  run.mockReset()

  mockChangeStateJob()
})

function mockChangeStateJob({ canRun = true, isRunning = false }: { canRun?: boolean; isRunning?: boolean } = {}) {
  useChangeStateJob.mockReturnValue({
    run,
    canRun: ref(canRun),
    isRunning: ref(isRunning),
    errorMessage: ref(canRun ? undefined : 'Backup repository state change in progress…'),
  })
}

function mountButton(br: FrontXoBackupRepository = createBr()) {
  return mount(BackupRepositoryChangeStateButton, {
    props: { br },
    global: createGlobalTestConfig(),
  })
}

// The job receives the repositories and the targeted state as getters
function findJobArgs() {
  const [brs, enabled] = useChangeStateJob.mock.lastCall ?? []

  return { brs: toValue(brs), enabled: toValue(enabled) }
}

describe('on an enabled repository', () => {
  it('offers to disable it', () => {
    const button = mountButton(createBr({ enabled: true })).getComponent(UiButton)

    expect(button.text()).toBe(t('action:disable'))
    expect(button.props('leftIcon')).toBe('action:disable')
  })

  it('runs the job to disable it', () => {
    const br = createBr({ enabled: true })
    mountButton(br)

    expect(findJobArgs()).toEqual({ brs: [br], enabled: false })
  })
})

describe('on a disabled repository', () => {
  it('offers to connect it', () => {
    const button = mountButton(createBr({ enabled: false })).getComponent(UiButton)

    expect(button.text()).toBe(t('action:connect'))
    expect(button.props('leftIcon')).toBe('action:connect')
  })

  it('runs the job to connect it', () => {
    const br = createBr({ enabled: false })
    mountButton(br)

    expect(findJobArgs()).toEqual({ brs: [br], enabled: true })
  })
})

it('runs the job when clicking the button', async () => {
  await mountButton().getComponent(UiButton).trigger('click')

  expect(run).toHaveBeenCalledOnce()
})

it('disables the button when the job cannot run', () => {
  mockChangeStateJob({ canRun: false })

  expect(mountButton().getComponent(UiButton).props('disabled')).toBe(true)
})

it('shows the button as busy while the job runs', () => {
  mockChangeStateJob({ isRunning: true })

  expect(mountButton().getComponent(UiButton).props('busy')).toBe(true)
})
