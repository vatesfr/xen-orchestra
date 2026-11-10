import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { VueWrapper } from '@vue/test-utils'

export function findInputLabels(wrapper: VueWrapper) {
  return wrapper.findAllComponents(VtsInputWrapper).map(field => field.props('label'))
}
