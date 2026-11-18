import BackupRepositorySpeedCard from '@/modules/backup-repository/components/list/panel/cards/BackupRepositorySpeedCard.vue'
import { createTwiceBenchmarkedBr, LATEST_BR_BENCHMARK_RATES } from '@/test/create-br-benchmark.ts'
import { createBr } from '@/test/create-br.ts'
import { findPanelCardTitle } from '@/test/find-card-title.ts'
import { findCardCopiedValues, findCardLabelledValues, findCardRowLabels } from '@/test/find-rendered-values.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import { benchmarkJobMock } from '@/test/mock-backup-repository-benchmark-job.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { formatSpeed } from '@core/utils/speed.util.ts'
import type { VueWrapper } from '@vue/test-utils'

// The copy buttons of the rows are icon buttons too
function findBenchmarkButton(wrapper: VueWrapper) {
  const [button] = wrapper
    .findAllComponents(UiButtonIcon)
    .filter(iconButton => iconButton.element.closest('.vts-card-row-key-value') === null)

  return button
}

// The benchmark button of the card
const mountCard = itRunsJobFromButton(BackupRepositorySpeedCard, {
  targetProp: 'br',
  createTarget: createBr,
  getButton: findBenchmarkButton,
  job: benchmarkJobMock,
  toJobTarget: null,
  // A spinner shows it busy
  expectBusy: button => expect(button.props('icon')).toBe('fa:spinner'),
})

function findSpeeds(wrapper: VueWrapper) {
  const values = findCardLabelledValues(wrapper)

  return { write: values[t('writing-speed')], read: values[t('reading-speed')] }
}

it('renders the card title', () => {
  const wrapper = mountCard()

  expect(findPanelCardTitle(wrapper)).toBe(t('speed'))
})

it('lists the writing and reading speeds only', () => {
  const wrapper = mountCard()

  expect(findCardRowLabels(wrapper)).toEqual([t('writing-speed'), t('reading-speed')])
})

it('leaves the speeds empty and not copyable when the repository was never benchmarked', () => {
  const wrapper = mountCard(createBr({ benchmarks: [] }))

  expect(findSpeeds(wrapper)).toEqual({ write: '', read: '' })
  expect(findCardCopiedValues(wrapper)).toEqual([])
})

it('shows the speeds of the latest stored benchmark and offers to copy them', () => {
  const wrapper = mountCard(createTwiceBenchmarkedBr())
  const write = formatSpeed(LATEST_BR_BENCHMARK_RATES.write)
  const read = formatSpeed(LATEST_BR_BENCHMARK_RATES.read)

  expect(findSpeeds(wrapper)).toEqual({ write, read })
  expect(findCardCopiedValues(wrapper)).toEqual([write, read])
})
