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

// The label of a `UiTitle`, the title of a section or of a detail card
export function findTitleLabel(wrapper: { get: (selector: string) => { text: () => string } }) {
  return wrapper.get('.ui-title .label').text()
}

// The title alone, without what its info and description slots hold
export function findCardTitleLabel(wrapper: VueWrapper) {
  return wrapper.get('.ui-card-title .title').text()
}
