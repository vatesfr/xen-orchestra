import ApplianceEditUpdateSettingsButton from '@/modules/appliance/components/actions/edit-update-settings/ApplianceEditUpdateSettingsButton.vue'
import ApplianceUpdateSettingsCard from '@/modules/appliance/components/settings/ApplianceUpdateSettingsCard.vue'
import { findCardTitleLabel } from '@/test/find-card-title.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import { mount } from '@vue/test-utils'

// The edit button runs its own job, covered by its own test
function mountCard(dailyCheckEnabled?: boolean) {
  return mount(ApplianceUpdateSettingsCard, {
    props: { channel: 'stable', dailyCheckEnabled },
    global: createGlobalTestConfig({ stubs: { ApplianceEditUpdateSettingsButton: true } }),
  })
}

it('shows its title, and offers to edit the settings', () => {
  const wrapper = mountCard()

  expect(findCardTitleLabel(wrapper)).toBe(t('appliance:update-settings'))
  expect(wrapper.findComponent(ApplianceEditUpdateSettingsButton).exists()).toBe(true)
})

it('shows the channel and the manual install', () => {
  expect(findLabelledValues(mountCard())).toMatchObject({
    [t('appliance:release-channel')]: 'stable',
    [t('appliance:install')]: t('appliance:manual-install'),
  })
})

it.each([true, false])('shows whether the daily check is enabled (%s)', enabled => {
  expect(mountCard(enabled).getComponent(VtsEnabledState).props('enabled')).toBe(enabled)
})

it('shows no daily check state while it is unknown', () => {
  expect(mountCard(undefined).findComponent(VtsEnabledState).exists()).toBe(false)
})
