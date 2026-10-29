import V2vVmChecksCard from '@/modules/v2v/components/mapping/V2vVmChecksCard.vue'
import { findAccentedInfos } from '@/test/find-accented-labels.ts'
import { findCardTitle } from '@/test/find-card-title.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

const CHECKS = [
  { label: 'No unsupported disk', accent: 'success' },
  { label: '2 snapshots on the source VM', accent: 'warning' },
] as const

function mountCard() {
  return mount(V2vVmChecksCard, { props: { checks: [...CHECKS] }, global: createGlobalTestConfig() })
}

it('shows its title', () => {
  expect(findCardTitle(mountCard())).toBe(t('checks'))
})

it('tells each check with its accent, in order', () => {
  expect(findAccentedInfos(mountCard())).toEqual(CHECKS)
})
