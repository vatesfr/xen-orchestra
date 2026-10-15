import BackupRepositorySpeed from '@/modules/backup-repository/components/detail/BackupRepositorySpeed.vue'
import type { useXoBackupRepositoryBenchmarkJob } from '@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { formatSpeed } from '@core/utils/speed.util.ts'
import type { XoBackupRepositoryBenchmark } from '@vates/types'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'

const { useBenchmarkJob, run } = vi.hoisted(() => ({
  useBenchmarkJob: vi.fn(),
  run: vi.fn(),
}))

// The job monitors a task through a remote-resource collection, which would open an SSE subscription
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

function createBenchmark(overrides: Partial<XoBackupRepositoryBenchmark> = {}): XoBackupRepositoryBenchmark {
  return { readRate: 200_000_000, writeRate: 100_000_000, timestamp: 1_700_000_000_000, ...overrides }
}

function mountCard(br: FrontXoBackupRepository = createBr()) {
  return mount(BackupRepositorySpeed, {
    props: { br },
    global: createGlobalTestConfig(),
  })
}

function findBenchmarkButton(wrapper: ReturnType<typeof mountCard>) {
  return wrapper.getComponent(UiButtonIcon)
}

it('renders the card title', () => {
  const wrapper = mountCard()

  expect(wrapper.get('.ui-title .label').text()).toBe(t('speed'))
})

it('leaves the speeds empty when the repository was never benchmarked', () => {
  const wrapper = mountCard(createBr({ benchmarks: [] }))

  expect(findLabelledValues(wrapper)).toEqual({ [t('writing-speed')]: '', [t('reading-speed')]: '' })
})

it('shows the speeds of the latest stored benchmark', () => {
  const wrapper = mountCard(
    createBr({
      benchmarks: [
        createBenchmark({ writeRate: 1_000_000, readRate: 2_000_000 }),
        createBenchmark({ writeRate: 100_000_000, readRate: 200_000_000 }),
      ],
    })
  )

  expect(findLabelledValues(wrapper)).toEqual({
    [t('writing-speed')]: formatSpeed(100_000_000),
    [t('reading-speed')]: formatSpeed(200_000_000),
  })
})

it('shows the result of a benchmark run from the card in place of the stored one', async () => {
  run.mockResolvedValue({ writeRate: 300_000_000, readRate: 400_000_000 })
  const wrapper = mountCard(createBr({ benchmarks: [createBenchmark()] }))

  await findBenchmarkButton(wrapper).trigger('click')
  await flushPromises()

  expect(findLabelledValues(wrapper)).toEqual({
    [t('writing-speed')]: formatSpeed(300_000_000),
    [t('reading-speed')]: formatSpeed(400_000_000),
  })
})

it('disables the benchmark button when the job cannot run', () => {
  mockBenchmarkJob({ canRun: false })
  const wrapper = mountCard()

  expect(findBenchmarkButton(wrapper).props('disabled')).toBe(true)
})

it('shows a spinner on the benchmark button while the benchmark runs', () => {
  mockBenchmarkJob({ isRunning: true })
  const wrapper = mountCard()

  expect(findBenchmarkButton(wrapper).props('icon')).toBe('fa:spinner')
})
