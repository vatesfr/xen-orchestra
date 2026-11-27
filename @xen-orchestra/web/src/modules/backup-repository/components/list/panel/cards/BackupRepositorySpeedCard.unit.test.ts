import BackupRepositorySpeedCard from '@/modules/backup-repository/components/list/panel/cards/BackupRepositorySpeedCard.vue'
import { findBrSpeeds } from '@/test/br-card-kind.ts'
import { itRendersCardTitle } from '@/test/card-title.ts'
import { createTwiceBenchmarkedBr, getLatestBrBenchmarkSpeeds } from '@/test/create-br-benchmark.ts'
import { createBr } from '@/test/create-br.ts'
import { CARD_KEY_VALUE_ROW_SELECTOR, findCardCopiedValues, findCardRowLabels } from '@/test/find-rendered-values.ts'
import { findPanelCardTitleLabel } from '@/test/find-titles.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import { benchmarkJobMock } from '@/test/mock-backup-repository-benchmark-job.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import type { VueWrapper } from '@vue/test-utils'

// The copy buttons of the rows are icon buttons too
function findBenchmarkButton(wrapper: VueWrapper) {
  const [button] = wrapper
    .findAllComponents(UiButtonIcon)
    .filter(iconButton => iconButton.element.closest(CARD_KEY_VALUE_ROW_SELECTOR) === null)

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

itRendersCardTitle(mountCard, t('speed'), findPanelCardTitleLabel)

it('lists the writing and reading speeds only', () => {
  const wrapper = mountCard()

  expect(findCardRowLabels(wrapper)).toEqual([t('writing-speed'), t('reading-speed')])
})

it('leaves the speeds empty and not copyable when the repository was never benchmarked', () => {
  const wrapper = mountCard(createBr({ benchmarks: [] }))

  expect(findBrSpeeds(wrapper, 'panel')).toEqual({ write: '', read: '' })
  expect(findCardCopiedValues(wrapper)).toEqual([])
})

it('shows the speeds of the latest stored benchmark and offers to copy them', () => {
  const wrapper = mountCard(createTwiceBenchmarkedBr())
  const speeds = getLatestBrBenchmarkSpeeds()

  expect(findBrSpeeds(wrapper, 'panel')).toEqual(speeds)
  expect(findCardCopiedValues(wrapper)).toEqual([speeds.write, speeds.read])
})
