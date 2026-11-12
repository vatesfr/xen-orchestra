import V2vShowSelectedVmsButton from '@/modules/v2v/components/selected-vms/V2vShowSelectedVmsButton.vue'
import { findButton, getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { usePanelStore } from '@core/stores/panel.store.ts'
import { flushPromises, mount } from '@vue/test-utils'

const LABEL = t('selected-vms-n', { n: 2 })

function mountButton(count = 2) {
  return mount(V2vShowSelectedVmsButton, { props: { count }, global: createGlobalTestConfig() })
}

it('has no button to show the panel while it is shown', () => {
  expect(findButton(mountButton(), LABEL)).toBeUndefined()
})

it('shows the panel again from its button, counting the VMs of the list, once closed', async () => {
  const wrapper = mountButton()
  const panelStore = usePanelStore()

  panelStore.collapse()
  await flushPromises()
  await getButton(wrapper, LABEL).trigger('click')

  expect(panelStore.isExpanded).toBe(true)
  expect(findButton(wrapper, LABEL)).toBeUndefined()
})

it('has no button to show the panel of an empty list', async () => {
  const wrapper = mountButton(0)

  usePanelStore().collapse()
  await flushPromises()

  expect(findButton(wrapper, t('selected-vms-n', { n: 0 }))).toBeUndefined()
})
