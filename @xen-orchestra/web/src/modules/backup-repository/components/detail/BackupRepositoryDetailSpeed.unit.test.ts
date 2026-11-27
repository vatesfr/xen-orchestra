import BackupRepositoryDetailSpeed from '@/modules/backup-repository/components/detail/BackupRepositoryDetailSpeed.vue'
import { findBrSpeeds } from '@/test/br-card-kind.ts'
import { itRendersCardTitle } from '@/test/card-title.ts'
import { createTwiceBenchmarkedBr, getLatestBrBenchmarkSpeeds } from '@/test/create-br-benchmark.ts'
import { createBr } from '@/test/create-br.ts'
import { findRowLabels } from '@/test/find-rendered-values.ts'
import { findTitleLabel } from '@/test/find-titles.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import { benchmarkJobMock } from '@/test/mock-backup-repository-benchmark-job.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'

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

itRendersCardTitle(mountCard, t('speed'), findTitleLabel)

it('lists the writing and reading speeds only', () => {
  const wrapper = mountCard()

  expect(findRowLabels(wrapper)).toEqual([t('writing-speed'), t('reading-speed')])
})

it('leaves the speeds empty when the repository was never benchmarked', () => {
  const wrapper = mountCard(createBr({ benchmarks: [] }))

  expect(findBrSpeeds(wrapper, 'detail')).toEqual({ write: '', read: '' })
})

it('shows the speeds of the latest stored benchmark', () => {
  const wrapper = mountCard(createTwiceBenchmarkedBr())

  expect(findBrSpeeds(wrapper, 'detail')).toEqual(getLatestBrBenchmarkSpeeds())
})
