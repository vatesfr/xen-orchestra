import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { VueWrapper } from '@vue/test-utils'

export function findInputLabels(wrapper: VueWrapper) {
  return wrapper.findAllComponents(VtsInputWrapper).map(field => field.props('label'))
}

export function getInputWrapper(wrapper: VueWrapper, label: string) {
  const field = wrapper.findAllComponents(VtsInputWrapper).find(field => field.props('label') === label)

  if (field === undefined) {
    throw new Error(`No field labelled "${label}"`)
  }

  return field
}
