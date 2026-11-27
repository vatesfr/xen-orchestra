import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
import type { VueWrapper } from '@vue/test-utils'

// Each `UiTabItem` of the wrapper, in order
export function findTabs(wrapper: Pick<VueWrapper, 'findAllComponents'>) {
  return wrapper.findAllComponents(UiTabItem)
}

// The `UiTabItem` of the wrapper with that label, `undefined` without one
export function findTab(wrapper: Pick<VueWrapper, 'findAllComponents'>, label: string) {
  return findTabs(wrapper).find(tab => tab.text() === label)
}
