import BackupRepositoryChangeStateButton from '@/modules/backup-repository/components/actions/change-state/BackupRepositoryChangeStateButton.vue'
import { useXoBackupRepositoryChangeStateJob } from '@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { mount } from '@vue/test-utils'
import { toValue } from 'vue'

// The job patches the repositories through the REST API
const changeStateJob = createJobStub(useXoBackupRepositoryChangeStateJob)

beforeEach(() => {
  changeStateJob.reset()
})

function mountButton(br: FrontXoBackupRepository = createBr()) {
  return mount(BackupRepositoryChangeStateButton, {
    props: { br },
    global: createGlobalTestConfig(),
  })
}

// The job receives the repositories and the targeted state as getters
function findJobArgs() {
  const [brs, enabled] = changeStateJob.use.mock.lastCall ?? []

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

  expect(changeStateJob.run).toHaveBeenCalledOnce()
})

it('disables the button when the job cannot run', () => {
  changeStateJob.setState({ canRun: false })

  expect(mountButton().getComponent(UiButton).props('disabled')).toBe(true)
})

it('shows the button as busy while the job runs', () => {
  changeStateJob.setState({ isRunning: true })

  expect(mountButton().getComponent(UiButton).props('busy')).toBe(true)
})
