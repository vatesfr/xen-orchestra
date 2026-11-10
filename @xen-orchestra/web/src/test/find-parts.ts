import type { VueWrapper } from '@vue/test-utils'

export function findParts(wrapper: VueWrapper, selector: string) {
  return wrapper
    .find(selector)
    .findAll('.part')
    .map(part => part.text())
}
