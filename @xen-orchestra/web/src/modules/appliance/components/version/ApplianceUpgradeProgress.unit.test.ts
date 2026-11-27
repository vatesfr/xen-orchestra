import ApplianceUpgradeProgress from '@/modules/appliance/components/version/ApplianceUpgradeProgress.vue'
import type { ApplianceUpgrade } from '@/modules/appliance/types/appliance-upgrade.type.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { formatTime } from '@core/utils/time.util.ts'
import { mount } from '@vue/test-utils'

const START = Date.UTC(2026, 10, 27, 9, 30)

function mountProgress(upgrade: ApplianceUpgrade) {
  return mount(ApplianceUpgradeProgress, { props: { upgrade }, global: createGlobalTestConfig() })
}

function findSecondaryTexts(upgrade: ApplianceUpgrade) {
  return mountProgress(upgrade)
    .findAll('.secondary')
    .map(text => text.text())
}

it('tells XO is being updated', () => {
  expect(mountProgress({ phase: 'upgrade' }).get('.typo-h4').text()).toBe(t('appliance:updating-xo'))
})

it('tells a snapshot is being taken during the snapshot phase', () => {
  expect(findSecondaryTexts({ phase: 'snapshot' })).toEqual([t('appliance:upgrade-taking-snapshot')])
})

it('warns about the restart during the upgrade phase', () => {
  expect(findSecondaryTexts({ phase: 'upgrade' })).toEqual([t('appliance:upgrade-restart-info')])
})

it('tells when the upgrade started, once known', () => {
  expect(findSecondaryTexts({ phase: 'upgrade', start: START })).toEqual([
    t('appliance:upgrade-started-at', { time: formatTime(START) }),
    t('appliance:upgrade-restart-info'),
  ])
})
