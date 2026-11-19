import type { VueWrapper } from '@vue/test-utils'

export function findCardTitle(wrapper: VueWrapper) {
  return wrapper.get('.ui-card-title').text()
}

export function findPanelCardTitle(wrapper: VueWrapper) {
  return wrapper.get('.ui-panel-card-title .title').text()
}

// Every panel card title of a card, its sub-titles included, in order
export function findPanelCardTitles(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-panel-card-title .title').map(title => title.text())
}

// The title alone, without what its info and description slots hold
export function findCardTitleLabel(wrapper: VueWrapper) {
  return wrapper.get('.ui-card-title .title').text()
}
