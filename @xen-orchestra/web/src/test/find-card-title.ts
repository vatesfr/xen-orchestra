import type { VueWrapper } from '@vue/test-utils'

export function findCardTitle(wrapper: VueWrapper) {
  return wrapper.get('.ui-card-title').text()
}
