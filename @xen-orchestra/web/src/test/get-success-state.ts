import { findTitle } from '@/test/find-titles.ts'
import VtsSuccessStateHero from '@core/components/success-state-hero/VtsSuccessStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { VueWrapper } from '@vue/test-utils'

// What the success state of a wrapper tells: its title and its message, and the link among its actions, each
// `undefined` without one
export function getSuccessState(wrapper: Pick<VueWrapper, 'getComponent'>) {
  const hero = wrapper.getComponent(VtsSuccessStateHero)
  const link = hero.findComponent(UiLink)

  return {
    title: findTitle(hero),
    message: hero.getComponent(UiAlert).text(),
    link: link.exists() ? { label: link.text(), to: link.props('to') } : undefined,
  }
}
