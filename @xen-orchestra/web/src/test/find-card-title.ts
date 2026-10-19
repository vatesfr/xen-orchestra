import type { VueWrapper } from '@vue/test-utils'

export function findCardTitle(wrapper: VueWrapper) {
  return wrapper.get('.ui-card-title').text()
}

// The title alone, without what its info and description slots hold
export function findCardTitleLabel(wrapper: VueWrapper) {
  return wrapper.get('.ui-card-title .title').text()
}
