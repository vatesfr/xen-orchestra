import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { findLink } from '@core-test/find-links.ts'
import type { DOMWrapper, VueWrapper } from '@vue/test-utils'

type TitleWrapper = Pick<VueWrapper, 'get'>

// The two card titles, the whole title (label, info, description, id to copy…) or its label alone
const CARD_TITLE = '.ui-card-title'
const PANEL_CARD_TITLE = '.ui-panel-card-title'

const readTitle = (wrapper: TitleWrapper, root: string) => wrapper.get(root).text()

// The label of a title, without the counter it may show next to it
const readLabel = (title: Pick<DOMWrapper<Element>, 'element'>) => {
  const label = title.element.cloneNode(true) as Element

  label.querySelector('.counter')?.remove()

  return label.textContent?.trim() ?? ''
}

const readTitleLabel = (wrapper: TitleWrapper, root: string) => readLabel(wrapper.get(`${root} .title`))

export function findCardTitle(wrapper: TitleWrapper) {
  return readTitle(wrapper, CARD_TITLE)
}

export function findCardTitleLabel(wrapper: TitleWrapper) {
  return readTitleLabel(wrapper, CARD_TITLE)
}

// What a card title shows in its `info` slot, next to its label, `undefined` without it
export function findCardTitleInfo(wrapper: Pick<VueWrapper, 'find'>) {
  const info = wrapper.find(`${CARD_TITLE} .info`)

  return info.exists() ? info.text() : undefined
}

export function findPanelCardTitle(wrapper: TitleWrapper) {
  return readTitle(wrapper, PANEL_CARD_TITLE)
}

export function findPanelCardTitleLabel(wrapper: TitleWrapper) {
  return readTitleLabel(wrapper, PANEL_CARD_TITLE)
}

// The link of a panel card title, `undefined` without one
export function findPanelCardTitleLink(wrapper: TitleWrapper) {
  return findLink(wrapper.get(PANEL_CARD_TITLE))
}

// The counter the first `UiPanelCardTitle` of a card is handed, `undefined` without one
export function findPanelCardCounter(wrapper: Pick<VueWrapper, 'getComponent'>) {
  return wrapper.getComponent(UiPanelCardTitle).props('counter')
}

// The icon the first `UiPanelCardTitle` of a card is handed, and its tooltip
export function findPanelCardTitleIcon(wrapper: Pick<VueWrapper, 'getComponent'>) {
  const title = wrapper.getComponent(UiPanelCardTitle)

  return { icon: title.props('icon'), tooltip: title.props('iconTooltip') }
}

// Every panel card title label of a card, its sub-titles included, in order
export function findPanelCardTitleLabels(wrapper: Pick<VueWrapper, 'findAll'>) {
  return wrapper.findAll(`${PANEL_CARD_TITLE} .title`).map(readLabel)
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
