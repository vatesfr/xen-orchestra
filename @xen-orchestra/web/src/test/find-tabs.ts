import type { VueWrapper } from '@vue/test-utils'

export function findTabs(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-tab-item')
}
