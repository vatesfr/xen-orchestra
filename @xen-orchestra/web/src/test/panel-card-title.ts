import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import type { VueWrapper } from '@vue/test-utils'

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
