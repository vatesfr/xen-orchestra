import type { VueWrapper } from '@vue/test-utils'

// The parts of an `interpunct-list` are its children, the separators being CSS only
export function findParts(wrapper: VueWrapper, selector: string) {
  return wrapper
    .find(selector)
    .findAll(':scope > *')
    .map(part => part.text())
}
