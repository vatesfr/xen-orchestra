import BackupRepositoryBenchmarkButton from '@/modules/backup-repository/components/actions/benchmark/BackupRepositoryBenchmarkButton.vue'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { benchmarkJobMock } from '@/test/mock-backup-repository-benchmark-job.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { mount } from '@vue/test-utils'
import { toValue } from 'vue'

beforeEach(() => {
  benchmarkJobMock.reset()
})

function mountButton(br: FrontXoBackupRepository = createBr()) {
  return mount(BackupRepositoryBenchmarkButton, {
    props: { br },
    global: createGlobalTestConfig(),
  })
}

// The job receives the repositories as a getter
function findJobBrs() {
  const [brs] = benchmarkJobMock.use.mock.lastCall ?? []

  return toValue(brs)
}

it('runs the job on the repository', () => {
  const br = createBr()
  mountButton(br)

  expect(findJobBrs()).toEqual([br])
})

it('runs the job when clicking the button', async () => {
  await mountButton().getComponent(UiButtonIcon).trigger('click')

  expect(benchmarkJobMock.run).toHaveBeenCalledOnce()
})

it('disables the button when the job cannot run', () => {
  benchmarkJobMock.setState({ canRun: false })

  expect(mountButton().getComponent(UiButtonIcon).props('disabled')).toBe(true)
})

it('shows a scan icon while the job is not running', () => {
  expect(mountButton().getComponent(UiButtonIcon).props('icon')).toBe('action:scan')
})

it('shows a spinner while the job runs', () => {
  benchmarkJobMock.setState({ isRunning: true })

  expect(mountButton().getComponent(UiButtonIcon).props('icon')).toBe('fa:spinner')
})
