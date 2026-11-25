import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import type { VueWrapper } from '@vue/test-utils'

// The type of each state hero the wrapper renders, in order: which state it shows (busy, not found…), or none
export function findStateHeroTypes(wrapper: Pick<VueWrapper, 'findAllComponents'>) {
  return wrapper.findAllComponents(VtsStateHero).map(stateHero => stateHero.props('type'))
}
