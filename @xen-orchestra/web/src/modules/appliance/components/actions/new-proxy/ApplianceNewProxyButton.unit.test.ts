import ApplianceNewProxyButton from '@/modules/appliance/components/actions/new-proxy/ApplianceNewProxyButton.vue'
import { useNewProxy } from '@/modules/appliance/composables/use-new-proxy.composable.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { mount } from '@vue/test-utils'

// The composable runs the job setting the proxy, which calls the REST API
const newProxy = createJobStub(useNewProxy, result => ({
  openNewProxyDrawer: result.run,
  isAddingProxy: result.isRunning,
}))

beforeEach(() => {
  newProxy.reset()
})

function mountButton() {
  return mount(ApplianceNewProxyButton, { global: createGlobalTestConfig() }).getComponent(UiButton)
}

it('offers to set a proxy', () => {
  expect(mountButton().text()).toBe(t('action:set-proxy'))
})

it('opens the drawer when clicking the button', async () => {
  await mountButton().trigger('click')

  expect(newProxy.run).toHaveBeenCalledOnce()
})

it('shows the button as busy while the proxy is being added', () => {
  newProxy.setState({ isRunning: true })

  expect(mountButton().props('busy')).toBe(true)
})
