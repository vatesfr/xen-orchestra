import BackupRepositoryDetailSpeed from '@/modules/backup-repository/components/detail/BackupRepositoryDetailSpeed.vue'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBrBenchmark } from '@/test/create-br-benchmark.ts'
import { createBr } from '@/test/create-br.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { benchmarkJobMock } from '@/test/mock-backup-repository-benchmark-job.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { formatSpeed } from '@core/utils/speed.util.ts'
import { mount } from '@vue/test-utils'

beforeEach(() => {
  benchmarkJobMock.reset()
})

function mountCard(br: FrontXoBackupRepository = createBr()) {
  return mount(BackupRepositoryDetailSpeed, {
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
        createBrBenchmark({ writeRate: 1_000_000, readRate: 2_000_000 }),
        createBrBenchmark({ writeRate: 100_000_000, readRate: 200_000_000 }),
      ],
    })
  )

  expect(findLabelledValues(wrapper)).toEqual({
    [t('writing-speed')]: formatSpeed(100_000_000),
    [t('reading-speed')]: formatSpeed(200_000_000),
  })
})

it('runs the benchmark job when clicking the benchmark button', async () => {
  const wrapper = mountCard()

  await findBenchmarkButton(wrapper).trigger('click')

  expect(benchmarkJobMock.run).toHaveBeenCalledOnce()
})

it('disables the benchmark button when the job cannot run', () => {
  benchmarkJobMock.setState({ canRun: false })
  const wrapper = mountCard()

  expect(findBenchmarkButton(wrapper).props('disabled')).toBe(true)
})

it('shows a spinner on the benchmark button while the benchmark runs', () => {
  benchmarkJobMock.setState({ isRunning: true })
  const wrapper = mountCard()

  expect(findBenchmarkButton(wrapper).props('icon')).toBe('fa:spinner')
})
