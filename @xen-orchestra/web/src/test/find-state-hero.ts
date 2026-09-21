import type { VueWrapper } from '@vue/test-utils'

type QueryableWrapper = Pick<VueWrapper, 'get' | 'find' | 'findAll'>

/**
 * The wording the `VtsStateHero` of a mounted component shows. The hero renders
 * its own wording ahead of the slot — an `all-done` one reads `'All good!…'` —
 * so a component asserting only what it slots in reads this with `toContain`.
 *
 * Throws when the component renders no hero at all, which is what says one was
 * expected: {@link hasStateHero} is how a test asserts there is none.
 */
export function findStateHeroText(wrapper: QueryableWrapper) {
  return wrapper.get('.vts-state-hero').text()
}

/** Whether the component fell back to a state hero instead of rendering its content. */
export function hasStateHero(wrapper: QueryableWrapper) {
  return wrapper.find('.vts-state-hero').exists()
}

/** Whether the state hero is the busy one, i.e. the component is still loading. */
export function isStateHeroBusy(wrapper: QueryableWrapper) {
  return wrapper.find('.vts-state-hero .loader').exists()
}

/**
 * The wording of every state hero a component renders, in order — which is how a
 * component laying out several sections says it fell back to a single hero
 * rather than to one per section.
 */
export function findStateHeroTexts(wrapper: QueryableWrapper) {
  return wrapper.findAll('.vts-state-hero').map(hero => hero.text())
}
