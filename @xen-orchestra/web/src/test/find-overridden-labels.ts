import UiOverridden from '@core/components/ui/overridden/UiOverridden.vue'
import type { VueWrapper } from '@vue/test-utils'

// The label of each `UiOverridden` marker the wrapper renders, in order
export function findOverriddenLabels(wrapper: Pick<VueWrapper, 'findAllComponents'>) {
  return wrapper.findAllComponents(UiOverridden).map(marker => marker.text())
}
