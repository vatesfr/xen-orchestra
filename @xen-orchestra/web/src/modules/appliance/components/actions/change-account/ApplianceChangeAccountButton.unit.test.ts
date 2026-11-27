import ApplianceChangeAccountButton from '@/modules/appliance/components/actions/change-account/ApplianceChangeAccountButton.vue'
import { useRegisterAppliance } from '@/modules/appliance/composables/use-register-appliance.composable.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { mount } from '@vue/test-utils'

// The composable runs the registration job, which calls the REST API
const registerAppliance = createJobStub(useRegisterAppliance, result => ({
  openRegisterApplianceDrawer: result.run,
  isRegistering: result.isRunning,
}))

beforeEach(() => {
  registerAppliance.reset()
})

function mountButton() {
  return mount(ApplianceChangeAccountButton, { global: createGlobalTestConfig() }).getComponent(UiButton)
}

it('offers to change the account', () => {
  const button = mountButton()

  expect(button.text()).toBe(t('action:change-account'))
  expect(button.props('leftIcon')).toBe('action:edit')
})

it('replaces the current registration', () => {
  mountButton()

  expect(registerAppliance.use).toHaveBeenCalledWith({ renew: true })
})

it('opens the drawer when clicking the button', async () => {
  await mountButton().trigger('click')

  expect(registerAppliance.run).toHaveBeenCalledOnce()
})

it('shows the button as busy while the appliance is being registered', () => {
  registerAppliance.setState({ isRunning: true })

  expect(mountButton().props('busy')).toBe(true)
})
