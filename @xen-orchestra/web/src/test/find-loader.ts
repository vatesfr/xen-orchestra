import type { VueWrapper } from '@vue/test-utils'

type QueryableWrapper = Pick<VueWrapper, 'find'>

/**
 * Whether the component renders a `UiLoader`, which is how it says it is still
 * waiting for its data.
 *
 * Unscoped: it answers for the whole subtree, so a component whose loader sits
 * in a state hero reads with `isStateHeroBusy` and one whose head bar swaps its
 * icon for a loader with `isHeadBarIconBusy`, both of which name *where* it is.
 */
export function isLoading(wrapper: QueryableWrapper) {
  return wrapper.find('.ui-loader').exists()
}
