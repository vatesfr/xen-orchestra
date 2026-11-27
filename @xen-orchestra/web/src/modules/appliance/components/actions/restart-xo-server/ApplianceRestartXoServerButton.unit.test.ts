import ApplianceRestartXoServerButton from '@/modules/appliance/components/actions/restart-xo-server/ApplianceRestartXoServerButton.vue'
import { useXoaUpgrade } from '@/modules/appliance/composables/use-xoa-upgrade.composable.ts'
import { useXoaRestartXoServerJob } from '@/modules/appliance/jobs/xoa-restart-xo-server.job.ts'
import type { ApplianceUpgrade } from '@/modules/appliance/types/appliance-upgrade.type.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { findTooltipContent } from '@/test/find-tooltip-content.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockOverlay, overlayMock } from '@/test/mock-overlay.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

type RestartModalOverlay = {
  events: { onConfirm: () => unknown; onCancel: true }
}

const restartJob = createJobStub(useXoaRestartXoServerJob)

const xoaUpgrade = mockedExport(useXoaUpgrade)

const upgrade = ref<ApplianceUpgrade>()

mockOverlay()

beforeEach(() => {
  restartJob.reset()
  overlayMock.reset()

  upgrade.value = undefined
  xoaUpgrade.mockReturnValue({ upgrade })
})

function mountButton() {
  return mount(ApplianceRestartXoServerButton, { global: createGlobalTestConfig() })
}

function getModal() {
  return overlayMock.getOverlay<RestartModalOverlay>()
}

it('offers to restart xo-server', () => {
  const item = mountButton().getComponent(MenuItem)

  expect(item.text()).toBe(t('action:restart-xo-server'))
  expect(item.props('icon')).toBe('action:reboot')
  expect(item.props('accent')).toBe('warning')
})

it('asks for confirmation when clicking the item', async () => {
  await mountButton().get('.menu-trigger').trigger('click')

  expect(getModal().open).toHaveBeenCalledOnce()
  expect(restartJob.run).not.toHaveBeenCalled()
})

it('restarts xo-server in the background once confirmed', () => {
  mountButton()

  getModal().events.onConfirm()

  expect(restartJob.run).toHaveBeenCalledWith({ detached: true })
})

it('closes the modal when it is cancelled', () => {
  mountButton()

  expect(getModal().events.onCancel).toBe(true)
})

it('is busy while xo-server is restarting', () => {
  restartJob.setState({ isRunning: true })

  expect(mountButton().getComponent(MenuItem).props('busy')).toBe(true)
})

it('is disabled, with the reason, while an update is being installed', async () => {
  upgrade.value = { phase: 'upgrade' }

  const item = mountButton().getComponent(MenuItem)

  expect(item.props('disabled')).toBe(true)
  expect(await findTooltipContent(item.element)).toBe(t('job:xoa-upgrade:in-progress'))
})

it('is enabled when no update is being installed', () => {
  expect(mountButton().getComponent(MenuItem).props('disabled')).toBe(false)
})
