import BackupRepositorySpaceAndSpeedCard from '@/modules/backup/components/repository/list/panel/cards/BackupRepositorySpaceAndSpeedCard.vue'
import type { useXoBackupRepositoryBenchmarkJob } from '@/modules/backup/jobs/xo-backup-repository-benchmark.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { findCardCopiedValues, findCardLabelledValues } from '@/test/find-labelled-values.ts'
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
vi.mock(import('@/modules/backup/jobs/xo-backup-repository-benchmark.job.ts'), () => ({
  useXoBackupRepositoryBenchmarkJob: useBenchmarkJob as unknown as typeof useXoBackupRepositoryBenchmarkJob,
}))

beforeEach(() => {
  vi.restoreAllMocks()
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
  return mount(BackupRepositorySpaceAndSpeedCard, {
    props: { br },
    global: createGlobalTestConfig(),
  })
}

function findSpeeds(wrapper: ReturnType<typeof mountCard>) {
  const values = findCardLabelledValues(wrapper)

  return { write: values[t('writing-speed')], read: values[t('reading-speed')] }
}

// The copy buttons of the rows are icon buttons too
function findBenchmarkButton(wrapper: ReturnType<typeof mountCard>) {
  const [button] = wrapper
    .findAllComponents(UiButtonIcon)
    .filter(iconButton => iconButton.element.closest('.vts-card-row-key-value') === null)

  return button
}

it('renders the card title', () => {
  const wrapper = mountCard()

  expect(wrapper.get('.ui-card-title').text()).toBe(t('space-and-speed'))
})

it('announces the space rows as coming soon', () => {
  const wrapper = mountCard()

  expect(findCardLabelledValues(wrapper)).toMatchObject({
    [t('used-space-on-br')]: t('coming-soon!'),
    [t('free-space-on-br')]: t('coming-soon!'),
    [t('allocated-space')]: t('coming-soon!'),
  })
})

it('leaves the speeds empty and not copyable when the repository was never benchmarked', () => {
  const wrapper = mountCard(createBr({ benchmarks: [] }))

  expect(findSpeeds(wrapper)).toEqual({ write: '', read: '' })
  expect(findCardCopiedValues(wrapper)).toEqual([])
})

it('shows the speeds of the latest stored benchmark and offers to copy them', () => {
  const wrapper = mountCard(
    createBr({
      benchmarks: [
        createBenchmark({ writeRate: 1_000_000, readRate: 2_000_000 }),
        createBenchmark({ writeRate: 100_000_000, readRate: 200_000_000 }),
      ],
    })
  )

  expect(findSpeeds(wrapper)).toEqual({ write: formatSpeed(100_000_000), read: formatSpeed(200_000_000) })
  expect(findCardCopiedValues(wrapper)).toEqual([formatSpeed(100_000_000), formatSpeed(200_000_000)])
})

it('shows the result of a benchmark run from the card in place of the stored one', async () => {
  run.mockResolvedValue({ writeRate: 300_000_000, readRate: 400_000_000 })
  const wrapper = mountCard(createBr({ benchmarks: [createBenchmark()] }))

  await findBenchmarkButton(wrapper).trigger('click')
  await flushPromises()

  expect(findSpeeds(wrapper)).toEqual({ write: formatSpeed(300_000_000), read: formatSpeed(400_000_000) })
})

it('keeps the displayed speeds when the benchmark fails', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  run.mockRejectedValue(new Error('Backup repository unreachable'))
  const wrapper = mountCard(createBr({ benchmarks: [createBenchmark()] }))

  await findBenchmarkButton(wrapper).trigger('click')
  await flushPromises()

  expect(findSpeeds(wrapper)).toEqual({ write: formatSpeed(100_000_000), read: formatSpeed(200_000_000) })
})

it('drops the result of a benchmark run from the card when another repository is shown', async () => {
  run.mockResolvedValue({ writeRate: 300_000_000, readRate: 400_000_000 })
  const wrapper = mountCard(createBr({ benchmarks: [createBenchmark()] }))

  await findBenchmarkButton(wrapper).trigger('click')
  await flushPromises()

  await wrapper.setProps({
    br: createBr({
      id: 'backup-repository-456' as FrontXoBackupRepository['id'],
      benchmarks: [createBenchmark({ writeRate: 5_000_000, readRate: 6_000_000 })],
    }),
  })

  expect(findSpeeds(wrapper)).toEqual({ write: formatSpeed(5_000_000), read: formatSpeed(6_000_000) })
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
