import type { VueWrapper } from '@vue/test-utils'

export function findTags(wrapper: Pick<VueWrapper, 'findAll'>) {
  return wrapper.findAll('.ui-tag').map(tag => tag.text())
}
