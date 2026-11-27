import ApplianceEditUpdateSettingsButton from '@/modules/appliance/components/actions/edit-update-settings/ApplianceEditUpdateSettingsButton.vue'
import { useEditUpdateSettings } from '@/modules/appliance/composables/use-edit-update-settings.composable.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { mount } from '@vue/test-utils'

// The composable runs the edit job, which calls the REST API
const editUpdateSettings = createJobStub(useEditUpdateSettings, result => ({
  openEditUpdateSettingsDrawer: result.run,
  isEditingUpdateSettings: result.isRunning,
}))

beforeEach(() => {
  editUpdateSettings.reset()
})

function mountButton() {
  return mount(ApplianceEditUpdateSettingsButton, { global: createGlobalTestConfig() }).getComponent(UiButton)
}

it('offers to edit the update settings', () => {
  const button = mountButton()

  expect(button.text()).toBe(t('action:edit'))
  expect(button.props('leftIcon')).toBe('action:edit')
})

it('opens the drawer when clicking the button', async () => {
  await mountButton().trigger('click')

  expect(editUpdateSettings.run).toHaveBeenCalledOnce()
})

it('shows the button as busy while the settings are being saved', () => {
  editUpdateSettings.setState({ isRunning: true })

  expect(mountButton().props('busy')).toBe(true)
})
