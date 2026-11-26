import V2vVmChecksCard from '@/modules/v2v/components/mapping/V2vVmChecksCard.vue'
import { findPanelCardTitleLabel } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { findAccentedInfos } from '@core-test/find-accented-labels.ts'
import { mount } from '@vue/test-utils'

const CHECKS = [
  { label: 'No unsupported disk', accent: 'success' },
  { label: '2 snapshots on the source VM', accent: 'warning' },
] as const

function mountCard() {
  return mount(V2vVmChecksCard, { props: { checks: [...CHECKS] }, global: createGlobalTestConfig() })
}

it('shows its title', () => {
  expect(findPanelCardTitleLabel(mountCard())).toBe(t('checks'))
})

it('tells each check with its accent, in order', () => {
  expect(findAccentedInfos(mountCard())).toEqual(CHECKS)
})
