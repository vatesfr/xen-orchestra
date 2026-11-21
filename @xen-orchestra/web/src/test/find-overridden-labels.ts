import UiOverridden from '@core/components/ui/overridden/UiOverridden.vue'
import type { VueWrapper } from '@vue/test-utils'

export function findOverriddenLabels(wrapper: Pick<VueWrapper, 'findAllComponents'>) {
  return wrapper.findAllComponents(UiOverridden).map(marker => marker.text())
}
