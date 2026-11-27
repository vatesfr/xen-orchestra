import ApplianceUpgradeBanner from '@/modules/appliance/components/ApplianceUpgradeBanner.vue'
import { useXoaUpgrade } from '@/modules/appliance/composables/use-xoa-upgrade.composable.ts'
import type { ApplianceUpgrade } from '@/modules/appliance/types/appliance-upgrade.type.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import VtsBanner from '@core/components/banner/VtsBanner.vue'
import { findAccentedInfos } from '@core-test/find-accented-labels.ts'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const xoaUpgrade = mockedExport(useXoaUpgrade)

const upgrade = ref<ApplianceUpgrade>()

beforeEach(() => {
  upgrade.value = undefined
  xoaUpgrade.mockReturnValue({ upgrade })
})

function mountBanner() {
  return mount(ApplianceUpgradeBanner, { global: createGlobalTestConfig() })
}

it('shows nothing when no update is being installed', () => {
  expect(mountBanner().findComponent(VtsBanner).exists()).toBe(false)
})

it('tells XO is being updated while an update is being installed', () => {
  upgrade.value = { phase: 'snapshot' }

  const wrapper = mountBanner()

  expect(wrapper.getComponent(VtsBanner).props('accent')).toBe('info')
  expect(findAccentedInfos(wrapper)).toEqual([{ label: t('appliance:xo-being-updated'), accent: 'info' }])
})
