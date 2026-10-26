import { flushPromises, type VueWrapper } from '@vue/test-utils'

type QueryableWrapper = Pick<VueWrapper, 'get' | 'findAll'>

// The options of a `VtsSelect` are only rendered once its dropdown is open,
// and the select listens to the clicks only once it has been mounted
export async function openSelect(wrapper: QueryableWrapper) {
  await flushPromises()
  await wrapper.get('.vts-select .ui-input').trigger('click')
  await flushPromises()
}

export function findSelectOptionLabels(wrapper: QueryableWrapper) {
  return wrapper.findAll('.ui-dropdown').map(option => option.text())
}

export async function pickSelectOption(wrapper: QueryableWrapper, label: string) {
  const option = wrapper.findAll('.ui-dropdown').find(option => option.text() === label)

  if (option === undefined) {
    throw new Error(`No option "${label}"`)
  }

  await option.trigger('click')
  await flushPromises()
}
