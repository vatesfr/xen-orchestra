import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import { flushPromises, type VueWrapper } from '@vue/test-utils'

// A drawer form confirms once its validation, which is async, has run
export async function submitDrawer(wrapper: VueWrapper) {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

export async function cancelDrawer(wrapper: VueWrapper) {
  await wrapper.getComponent(VtsOverlayCancelButton).trigger('click')
}

export function findDrawerButtonLabels(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-drawer .buttons button').map(button => button.text())
}
