import { flushPromises, type VueWrapper } from '@vue/test-utils'

type QueryableWrapper = Pick<VueWrapper, 'get' | 'findAll'>

// The options of a `VtsSelect` are only rendered once its dropdown is open,
// and the select listens to the clicks only once it has been mounted
export async function openSelect(wrapper: QueryableWrapper) {
  await flushPromises()
  await wrapper.get('.vts-select .ui-input').trigger('click')
  await flushPromises()
}

// A select shows its selection as the text of its readonly input
export function findSelectedLabels(wrapper: QueryableWrapper) {
  return wrapper.findAll('.vts-select .ui-input').map(input => input.text())
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
