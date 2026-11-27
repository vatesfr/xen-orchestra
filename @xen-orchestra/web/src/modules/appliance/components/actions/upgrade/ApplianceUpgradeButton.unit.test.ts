import ApplianceUpgradeButton from '@/modules/appliance/components/actions/upgrade/ApplianceUpgradeButton.vue'
import { useInstallUpdate } from '@/modules/appliance/composables/use-install-update.composable.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { mount } from '@vue/test-utils'
import { toValue } from 'vue'

// The composable runs the snapshot and the upgrade jobs, which call the REST API
const installUpdate = createJobStub(useInstallUpdate, result => ({
  openInstallUpdateDrawer: result.run,
  isInstallingUpdate: result.isRunning,
}))

beforeEach(() => {
  installUpdate.reset()
})

const VERSIONS = { channel: 'stable', currentVersion: '5.100.0', nextVersion: '5.101.0' }

function mountButton(props: { busy?: boolean } = {}) {
  return mount(ApplianceUpgradeButton, { props: { ...VERSIONS, ...props }, global: createGlobalTestConfig() })
}

it('offers to install the update', () => {
  const button = mountButton().getComponent(UiButton)

  expect(button.text()).toBe(t('action:install-update'))
  expect(button.props('leftIcon')).toBe('action:download')
})

it('installs the update of its versions', () => {
  mountButton()

  const [versions] = installUpdate.use.mock.lastCall ?? []

  expect(toValue(versions)).toEqual(VERSIONS)
})

it('opens the drawer when clicking the button', async () => {
  await mountButton().getComponent(UiButton).trigger('click')

  expect(installUpdate.run).toHaveBeenCalledOnce()
})

it('tells once the update is installed', () => {
  const wrapper = mountButton()

  const [, onUpgraded] = installUpdate.use.mock.lastCall as [unknown, () => void]
  onUpgraded()

  expect(wrapper.emitted('upgraded')).toHaveLength(1)
})

it('shows the button as busy while the update is being installed', () => {
  installUpdate.setState({ isRunning: true })

  expect(mountButton().getComponent(UiButton).props('busy')).toBe(true)
})

it('shows the button as busy when told so', () => {
  expect(mountButton({ busy: true }).getComponent(UiButton).props('busy')).toBe(true)
})
