import { flushPromises, type VueWrapper } from '@vue/test-utils'

export async function openSelect(wrapper: VueWrapper) {
  // The select only listens to its trigger once its refs are bound, after the mount
  await flushPromises()
  await wrapper.get('.vts-select .ui-input').trigger('click')
  await flushPromises()
}

export function findSelectOptionLabels(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-dropdown').map(option => option.text())
}
