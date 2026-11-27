import ApplianceCheckUpdatesButton from '@/modules/appliance/components/actions/check-updates/ApplianceCheckUpdatesButton.vue'
import { useXoaUpgrade } from '@/modules/appliance/composables/use-xoa-upgrade.composable.ts'
import { useXoaPackages } from '@/modules/appliance/remote-resources/use-xoa-packages.ts'
import type { ApplianceUpgrade } from '@/modules/appliance/types/appliance-upgrade.type.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const packagesResource = mockedExport(useXoaPackages)

const xoaUpgrade = mockedExport(useXoaUpgrade)

const checkUpdates = vi.fn()

const isCheckingUpdates = ref(false)

const upgrade = ref<ApplianceUpgrade>()

beforeEach(() => {
  checkUpdates.mockReset()
  isCheckingUpdates.value = false
  upgrade.value = undefined

  packagesResource.mockReturnValue({ checkUpdates, isCheckingUpdates })
  xoaUpgrade.mockReturnValue({ upgrade })
})

function mountButton() {
  return mount(ApplianceCheckUpdatesButton, { global: createGlobalTestConfig() }).getComponent(VtsActionButton)
}

it('offers to check for updates', () => {
  const button = mountButton()

  expect(button.text()).toBe(t('action:check-for-updates'))
  expect(button.props('icon')).toBe('action:scan')
})

it('checks for updates when clicking the button', async () => {
  await mountButton().trigger('click')

  expect(checkUpdates).toHaveBeenCalledOnce()
})

it('shows the button as busy while the updates are being checked', () => {
  isCheckingUpdates.value = true

  expect(mountButton().props('busy')).toBe(true)
})

it('is enabled without hint when no update is being installed', () => {
  const button = mountButton()

  expect(button.props('disabled')).toBe(false)
  expect(button.props('hint')).toBeUndefined()
})

it('is disabled, with the reason, while an update is being installed', () => {
  upgrade.value = { phase: 'upgrade' }

  const button = mountButton()

  expect(button.props('disabled')).toBe(true)
  expect(button.props('hint')).toBe(t('job:xoa-upgrade:in-progress'))
})
