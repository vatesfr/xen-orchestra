import type { VueWrapper } from '@vue/test-utils'

// The label of the `UiHeadBar` of a page header
export function findHeadBarLabel(wrapper: Pick<VueWrapper, 'get'>) {
  return wrapper.get('.ui-head-bar .label').text()
}

// The items of the breadcrumb of a page header, in order
export function findBreadcrumbItems(wrapper: Pick<VueWrapper, 'findAll'>) {
  return wrapper.findAll('.ui-breadcrumb li')
}

// Where the link of the breadcrumb of a page header leads back to
export function findBreadcrumbLink(wrapper: Pick<VueWrapper, 'get'>) {
  return wrapper.get('.ui-breadcrumb a.ui-link').attributes('href')
}
