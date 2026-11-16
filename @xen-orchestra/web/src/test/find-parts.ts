import type { VueWrapper } from '@vue/test-utils'

// Each element a `VtsInlineParts` lays out is one part, whatever its tag
export function findParts(wrapper: Pick<VueWrapper, 'find'>, selector: string) {
  return wrapper
    .find(selector)
    .findAll(':scope > *')
    .map(part => part.text())
}
