import VtsSuccessStateHero from '@core/components/success-state-hero/VtsSuccessStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { findLink } from '@core-test/find-links.ts'
import { findTitle } from '@core-test/find-title.ts'
import type { VueWrapper } from '@vue/test-utils'

// What the success state of a wrapper tells: its title and its message, and the link among its actions, each
// `undefined` without one
export function getSuccessState(wrapper: Pick<VueWrapper, 'getComponent'>) {
  const hero = wrapper.getComponent(VtsSuccessStateHero)

  return {
    title: findTitle(hero),
    message: hero.getComponent(UiAlert).text(),
    link: findLink(hero),
  }
}
