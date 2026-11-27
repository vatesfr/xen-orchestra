import VtsDetailedOption from '@core/components/select/VtsDetailedOption.vue'
import { isPlaceholderShown } from '@core-test/is-placeholder-shown.ts'
import { flushPromises, type VueWrapper } from '@vue/test-utils'

type QueryableWrapper = Pick<VueWrapper, 'get' | 'findAll'>

const SELECT_INPUT = '.vts-select .ui-input'

// The options of a `VtsSelect` are only rendered once its dropdown is open,
// and the select listens to the clicks only once it has been mounted
export async function openSelect(wrapper: QueryableWrapper) {
  await flushPromises()
  await wrapper.get(SELECT_INPUT).trigger('click')
  await flushPromises()
}

// A select shows its selection as the text of its readonly input, its placeholder without selection
export function findShownSelections(wrapper: QueryableWrapper) {
  return wrapper.findAll(SELECT_INPUT).map(input => (isPlaceholderShown(input) ? '' : input.text()))
}

export function findSelectOptionLabels(wrapper: QueryableWrapper) {
  return wrapper.findAll('.ui-dropdown').map(option => option.text())
}

// Every `VtsDetailedOption` of an open select, as what it shows: its label, its icon and its tooltip, its details
export function findDetailedOptions(wrapper: Pick<VueWrapper, 'findAllComponents'>) {
  return wrapper.findAllComponents(VtsDetailedOption).map(option => ({
    label: option.props('option').properties.label,
    icon: option.props('icon'),
    iconTooltip: option.props('iconTooltip'),
    details: option.props('details'),
  }))
}

type PickOptions = {
  // The option shows details after its label, like the device of a PIF: its text only starts with the label
  detailed?: boolean
}

export async function pickSelectOption(
  wrapper: QueryableWrapper,
  label: string,
  { detailed = false }: PickOptions = {}
) {
  const option = wrapper
    .findAll('.ui-dropdown')
    .find(option => (detailed ? option.text().startsWith(label) : option.text() === label))

  if (option === undefined) {
    throw new Error(`No option "${label}"`)
  }

  await option.trigger('click')
  await flushPromises()
}

// Opens the select inside `container` (the whole wrapper by default), then picks its option labelled `label`
export async function chooseSelectOption(
  wrapper: QueryableWrapper,
  label: string,
  { container = wrapper, ...pickOptions }: PickOptions & { container?: QueryableWrapper } = {}
) {
  await openSelect(container)
  await pickSelectOption(wrapper, label, pickOptions)
}
