import BackupRepositoryBenchmarkButton from '@/modules/backup-repository/components/actions/benchmark/BackupRepositoryBenchmarkButton.vue'
import type { useXoBackupRepositoryBenchmarkJob } from '@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

const { useBenchmarkJob, run } = vi.hoisted(() => ({
  useBenchmarkJob: vi.fn(),
  run: vi.fn(),
}))

// The job subscribes to server events, unavailable in tests
vi.mock(import('@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'), () => ({
  useXoBackupRepositoryBenchmarkJob: useBenchmarkJob as unknown as typeof useXoBackupRepositoryBenchmarkJob,
}))

beforeEach(() => {
  useBenchmarkJob.mockReset()
  run.mockReset()

  mockBenchmarkJob()
})

function mockBenchmarkJob({ canRun = true, isRunning = false }: { canRun?: boolean; isRunning?: boolean } = {}) {
  useBenchmarkJob.mockReturnValue({
    run,
    canRun: ref(canRun),
    isRunning: ref(isRunning),
    errorMessage: ref(canRun ? undefined : 'Backup repository disabled'),
  })
}

function mountButton(br: FrontXoBackupRepository = createBr()) {
  return mount(BackupRepositoryBenchmarkButton, {
    props: { br },
    global: createGlobalTestConfig(),
  })
}

// The job receives the repositories as a getter
function findJobBrs() {
  const [brs] = useBenchmarkJob.mock.lastCall ?? []

  return toValue(brs)
}

it('runs the job on the repository', () => {
  const br = createBr()
  mountButton(br)

  expect(findJobBrs()).toEqual([br])
})

it('runs the job when clicking the button', async () => {
  await mountButton().getComponent(UiButtonIcon).trigger('click')

  expect(run).toHaveBeenCalledOnce()
})

it('disables the button when the job cannot run', () => {
  mockBenchmarkJob({ canRun: false })

  expect(mountButton().getComponent(UiButtonIcon).props('disabled')).toBe(true)
})

it('shows a scan icon while the job is not running', () => {
  expect(mountButton().getComponent(UiButtonIcon).props('icon')).toBe('action:scan')
})

it('shows a spinner while the job runs', () => {
  mockBenchmarkJob({ isRunning: true })

  expect(mountButton().getComponent(UiButtonIcon).props('icon')).toBe('fa:spinner')
})
