import type { VueWrapper } from '@vue/test-utils'
import type { Component } from 'vue'

/**
 * Mounts with the boolean `prop` set, then without it, and returns the value of that prop received by the child
 * `component` each time: `[true, false]` when the flag is forwarded.
 */
export function readForwardedFlag<TProps>(
  mountWith: (props: Partial<TProps>) => Pick<VueWrapper, 'getComponent'>,
  component: Component,
  prop: keyof TProps & string
) {
  return [{ [prop]: true } as Partial<TProps>, {}].map(
    props => (mountWith(props).getComponent(component).props() as Record<string, unknown>)[prop]
  )
}
