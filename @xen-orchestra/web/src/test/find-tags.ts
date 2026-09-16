import type { VueWrapper } from '@vue/test-utils'

type QueryableWrapper = Pick<VueWrapper, 'findAll'>

/**
 * Reads every `VtsTag` of a mounted component as the labels a user sees, in the
 * order they are laid out — an empty array when the object carries no tag.
 */
export function findTagLabels(wrapper: QueryableWrapper): string[] {
  return wrapper.findAll('.ui-tag').map(tag => tag.text())
}
