import type { VueWrapper } from '@vue/test-utils'

// Each element an `InlineParts` lays out is one part, whatever its tag
export function findParts(wrapper: Pick<VueWrapper, 'find'>, selector: string) {
  return wrapper
    .find(selector)
    .findAll(':scope > *')
    .map(part => part.text())
}

// The parts of the first `InlineParts` the wrapper renders
export function findInlineParts(wrapper: Pick<VueWrapper, 'find'>) {
  return findParts(wrapper, '.inline-parts')
}
