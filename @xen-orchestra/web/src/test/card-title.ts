import { findCardTitle } from '@/test/find-card-title.ts'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import type { VueWrapper } from '@vue/test-utils'

// The whole card title, or the parts a title holding more (a count, a top five) must contain
export type CardTitle = string | string[]

/**
 * Registers the title test of a card, on the card the mount helper renders by default. `findTitle` reads the title:
 * `findCardTitle` (a `UiCardTitle`, by default), `findPanelCardTitleLabel` (a side panel card) or `findTitleLabel`
 * (a `UiTitle`).
 */
export function itRendersCardTitle(
  mountCard: () => VueWrapper,
  title: CardTitle,
  findTitle: (wrapper: VueWrapper) => string = findCardTitle
) {
  it('renders the card title', () => {
    const cardTitle = findTitle(mountCard())

    if (typeof title === 'string') {
      expect(cardTitle).toBe(title)
    } else {
      title.forEach(part => expect(cardTitle).toContain(part))
    }
  })
}

// The props a panel card hands its `UiPanelCardTitle`: the name of its object as label, its id, and any other prop
type NameAndIdTitle = { label: string; id: string } & Record<string, unknown>

/**
 * Registers the title test of a side panel card titled with the name and the id of its object, on the card
 * `mountCard` renders. `title` also holds any other prop the card hands its title (`icon`, `href`…).
 */
export function itShowsNameAndIdTitle(
  mountCard: () => VueWrapper,
  title: NameAndIdTitle,
  name = 'titles the card with the name and the id of its object'
) {
  it(name, () => {
    expect(mountCard().getComponent(UiPanelCardTitle).props()).toMatchObject(title)
  })
}
