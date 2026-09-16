import { findIconPaths } from '@/test/find-icon-paths.ts'
import type { VueWrapper } from '@vue/test-utils'

type QueryableWrapper = Pick<VueWrapper, 'get' | 'find'>

/** The object name a mounted `UiHeadBar` shows as its title. */
export function findHeadBarLabel(wrapper: QueryableWrapper) {
  return wrapper.get('.ui-head-bar .label').text()
}

/**
 * The paths of the object icon a mounted `UiHeadBar` renders next to its title,
 * to compare with {@link findObjectIconPaths} — every header states the state of
 * its object that way.
 */
export function findHeadBarIconPaths(wrapper: QueryableWrapper) {
  return findIconPaths(wrapper.get('.ui-head-bar .label-wrapper'))
}

/**
 * Whether the header replaced its object icon with a loader, which is how it
 * says the object is changing state.
 */
export function isHeadBarIconBusy(wrapper: QueryableWrapper) {
  return wrapper.find('.ui-head-bar .label-wrapper .ui-loader').exists()
}

/** The first action a header offers as a link, rather than as a menu. */
export function findHeadBarActionLink(wrapper: QueryableWrapper) {
  return wrapper.get('.ui-head-bar .actions a')
}

/** Everything a header offers as actions, read as the text a user sees. */
export function findHeadBarActionsText(wrapper: QueryableWrapper) {
  return wrapper.get('.ui-head-bar .actions').text()
}

/** Whether the header offers its more-actions menu, whose trigger carries no label. */
export function hasHeadBarMoreActionsButton(wrapper: QueryableWrapper) {
  return wrapper.find('.ui-head-bar .actions button.ui-button-icon').exists()
}

/**
 * Whether the header renders its status slot, which is where an object says it
 * leads its pool.
 */
export function hasHeadBarStatus(wrapper: QueryableWrapper) {
  return wrapper.find('.ui-head-bar .status').exists()
}
