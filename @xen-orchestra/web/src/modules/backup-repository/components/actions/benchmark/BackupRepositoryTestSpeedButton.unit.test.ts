import BackupRepositoryTestSpeedButton from '@/modules/backup-repository/components/actions/benchmark/BackupRepositoryTestSpeedButton.vue'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { benchmarkJobMock } from '@/test/mock-backup-repository-benchmark-job.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { mount } from '@vue/test-utils'
import { toValue } from 'vue'

beforeEach(() => {
  benchmarkJobMock.reset()
})

function mountButton(br: FrontXoBackupRepository = createBr()) {
  return mount(BackupRepositoryTestSpeedButton, {
    props: { br },
    global: createGlobalTestConfig(),
  })
}

// The job receives the repositories as a getter
function findJobBrs() {
  const [brs] = benchmarkJobMock.use.mock.lastCall ?? []

  return toValue(brs)
}

it('offers to test the speed', () => {
  const button = mountButton().getComponent(VtsActionButton)

  expect(button.text()).toBe(t('action:test-speed'))
  expect(button.props('icon')).toBe('action:scan')
})

it('runs the job on the repository', () => {
  const br = createBr()
  mountButton(br)

  expect(findJobBrs()).toEqual([br])
})

it('runs the job when clicking the button', async () => {
  await mountButton().get('button').trigger('click')

  expect(benchmarkJobMock.run).toHaveBeenCalledOnce()
})

it('disables the button when the job cannot run', () => {
  benchmarkJobMock.setState({ canRun: false })

  expect(mountButton().getComponent(VtsActionButton).props('disabled')).toBe(true)
})

it('shows the button as busy while the job runs', () => {
  benchmarkJobMock.setState({ isRunning: true })

  expect(mountButton().getComponent(VtsActionButton).props('busy')).toBe(true)
})
