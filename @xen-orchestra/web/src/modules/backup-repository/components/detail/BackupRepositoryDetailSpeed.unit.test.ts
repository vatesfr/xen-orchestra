import BackupRepositoryDetailSpeed from '@/modules/backup-repository/components/detail/BackupRepositoryDetailSpeed.vue'
import { createTwiceBenchmarkedBr, LATEST_BR_BENCHMARK_RATES } from '@/test/create-br-benchmark.ts'
import { createBr } from '@/test/create-br.ts'
import { findTitleLabel } from '@/test/find-card-title.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import { benchmarkJobMock } from '@/test/mock-backup-repository-benchmark-job.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { formatSpeed } from '@core/utils/speed.util.ts'

// The benchmark button of the card
const mountCard = itRunsJobFromButton(BackupRepositoryDetailSpeed, {
  targetProp: 'br',
  createTarget: createBr,
  getButton: wrapper => wrapper.getComponent(UiButtonIcon),
  job: benchmarkJobMock,
  toJobTarget: null,
  // A spinner shows it busy
  expectBusy: button => expect(button.props('icon')).toBe('fa:spinner'),
})

it('renders the card title', () => {
  const wrapper = mountCard()

  expect(findTitleLabel(wrapper)).toBe(t('speed'))
})

it('leaves the speeds empty when the repository was never benchmarked', () => {
  const wrapper = mountCard(createBr({ benchmarks: [] }))

  expect(findLabelledValues(wrapper)).toEqual({ [t('writing-speed')]: '', [t('reading-speed')]: '' })
})

it('shows the speeds of the latest stored benchmark', () => {
  const wrapper = mountCard(createTwiceBenchmarkedBr())

  expect(findLabelledValues(wrapper)).toEqual({
    [t('writing-speed')]: formatSpeed(LATEST_BR_BENCHMARK_RATES.write),
    [t('reading-speed')]: formatSpeed(LATEST_BR_BENCHMARK_RATES.read),
  })
})
