import type { VueWrapper } from '@vue/test-utils'

export function findTitles(wrapper: Pick<VueWrapper, 'findAll'>) {
  return wrapper.findAll('.ui-title').map(title => title.text())
}
