import type { VueWrapper } from '@vue/test-utils'

export function findTitles(wrapper: Pick<VueWrapper, 'findAll'>) {
  return wrapper.findAll('.ui-title').map(title => title.text())
}

// The `.title` a `VtsSuccessStateHero` or a list item heads its content with, `undefined` without one
export function findTitle(wrapper: Pick<VueWrapper, 'find'>) {
  const title = wrapper.find('.title')

  return title.exists() ? title.text() : undefined
}
