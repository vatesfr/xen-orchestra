import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { findLink } from '@core-test/find-links.ts'
import type { VueWrapper } from '@vue/test-utils'

// The label of the `UiHeadBar` of a page header
export function findHeadBarLabel(wrapper: Pick<VueWrapper, 'get'>) {
  return wrapper.get('.ui-head-bar .label').text()
}

// The `VtsIcon` the `UiHeadBar` of a page header shows before its label
export function getHeadBarIcon(wrapper: Pick<VueWrapper, 'getComponent'>) {
  return wrapper.getComponent(UiHeadBar).getComponent(VtsIcon)
}

// What the `UiHeadBar` of a page header shows next to its label, absent when it shows nothing
export function findHeadBarStatus(wrapper: Pick<VueWrapper, 'find'>) {
  return wrapper.find('.ui-head-bar .status')
}

// A loader of the `UiHeadBar` of a page header: the one next to its label with `nextToLabel`, else any
export function findHeadBarLoader(wrapper: Pick<VueWrapper, 'find'>, { nextToLabel = false } = {}) {
  return wrapper.find(nextToLabel ? '.ui-head-bar .status .ui-loader' : '.ui-head-bar .ui-loader')
}

// The actions of the `UiHeadBar` of a page header
export function getHeadBarActions(wrapper: Pick<VueWrapper, 'get'>) {
  return wrapper.get('.ui-head-bar .actions')
}

// The items of the breadcrumb of a page header, in order
export function findBreadcrumbItems(wrapper: Pick<VueWrapper, 'findAll'>) {
  return wrapper.findAll('.ui-breadcrumb li')
}

// Where the link of the breadcrumb of a page header leads back to
export function findBreadcrumbLink(wrapper: Pick<VueWrapper, 'get'>) {
  return findLink(wrapper.get('.ui-breadcrumb'))?.href
}
