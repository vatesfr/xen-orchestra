import { findLink } from '@core-test/find-links.ts'
import type { VueWrapper } from '@vue/test-utils'

// The two card titles, the whole title (label, info, description, id to copy…) or its label alone
const CARD_TITLE = '.ui-card-title'
const PANEL_CARD_TITLE = '.ui-panel-card-title'

const readTitle = (wrapper: VueWrapper, root: string) => wrapper.get(root).text()

const readTitleLabel = (wrapper: VueWrapper, root: string) => wrapper.get(`${root} .title`).text()

export function findCardTitle(wrapper: VueWrapper) {
  return readTitle(wrapper, CARD_TITLE)
}

export function findCardTitleLabel(wrapper: VueWrapper) {
  return readTitleLabel(wrapper, CARD_TITLE)
}

export function findPanelCardTitle(wrapper: VueWrapper) {
  return readTitle(wrapper, PANEL_CARD_TITLE)
}

export function findPanelCardTitleLabel(wrapper: VueWrapper) {
  return readTitleLabel(wrapper, PANEL_CARD_TITLE)
}

// The link of a panel card title, `undefined` without one
export function findPanelCardTitleLink(wrapper: VueWrapper) {
  return findLink(wrapper.get(PANEL_CARD_TITLE))
}

// Every panel card title label of a card, its sub-titles included, in order
export function findPanelCardTitleLabels(wrapper: VueWrapper) {
  return wrapper.findAll(`${PANEL_CARD_TITLE} .title`).map(title => title.text())
}

// The text of each `UiCardSubtitle` of a card, in order
export function findCardSubtitles(wrapper: Pick<VueWrapper, 'findAll'>) {
  return wrapper.findAll('.ui-card-subtitle').map(subtitle => subtitle.text())
}

// The label of a `UiTitle`, the title of a section or of a detail card
export function findTitleLabel(wrapper: { get: (selector: string) => { text: () => string } }) {
  return wrapper.get('.ui-title .label').text()
}

// The text of each `UiTitle`, in order
export function findTitles(wrapper: Pick<VueWrapper, 'findAll'>) {
  return wrapper.findAll('.ui-title').map(title => title.text())
}
