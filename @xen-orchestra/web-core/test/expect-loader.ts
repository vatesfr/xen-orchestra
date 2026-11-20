import type { VueWrapper } from '@vue/test-utils'

// Whether a `UiLoader` is rendered
export function hasLoader(wrapper: Pick<VueWrapper, 'find'>) {
  return wrapper.find('.ui-loader').exists()
}

/**
 * Asserts a card shows a `UiLoader` in place of its content, `findContent` reading that content (rows, legends…),
 * empty while the card loads.
 */
export function expectLoaderInsteadOf<TWrapper extends Pick<VueWrapper, 'find'>>(
  wrapper: TWrapper,
  findContent: (wrapper: TWrapper) => unknown[]
) {
  expect(hasLoader(wrapper)).toBe(true)
  expect(findContent(wrapper)).toEqual([])
}
