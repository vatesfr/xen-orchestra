import type { VueWrapper } from '@vue/test-utils'

// The count of the hidden items a table cell shows next to its first one, `undefined` without one
export function findExtraCount(wrapper: Pick<VueWrapper, 'find'>) {
  const extraCount = wrapper.find('.extra-count')

  return extraCount.exists() ? extraCount.text() : undefined
}
