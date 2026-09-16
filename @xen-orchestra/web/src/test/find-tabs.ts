import type { VueWrapper } from '@vue/test-utils'

type QueryableWrapper = Pick<VueWrapper, 'findAll'>

function findTabs(wrapper: QueryableWrapper) {
  return wrapper.findAll('.ui-tab-item')
}

/**
 * Reads the `TabList` of a mounted header as the labels a user sees, in the
 * order they are laid out — every header renders the same surface, so its tests
 * do not each re-roll these queries.
 */
export function findTabLabels(wrapper: QueryableWrapper): string[] {
  return findTabs(wrapper).map(tab => tab.text())
}

/**
 * Hrefs of the tabs navigating inside XO 6. A tab leaving for XO 5 renders its
 * link *inside* the item instead of on it, so it is not an `<a>` itself and is
 * left out here — {@link findTab} reaches it.
 *
 * That `<a>` filter is not ours: it leans on web-core's `UiTabItem` falling back
 * to a `<span>` when given `tag="a"` with no `href`. `@xen-orchestra/web-core`
 * has no tests, so nothing guards that fallback — changing it turns every header
 * test red at once, and none of them names it.
 */
export function findInAppTabHrefs(wrapper: QueryableWrapper) {
  return findTabs(wrapper)
    .filter(tab => tab.element.tagName === 'A')
    .map(tab => tab.attributes('href'))
}

export function findActiveTabLabels(wrapper: QueryableWrapper): string[] {
  return findTabs(wrapper)
    .filter(tab => tab.classes('active'))
    .map(tab => tab.text())
}

export function findTab(wrapper: QueryableWrapper, label: string) {
  const tab = findTabs(wrapper).find(currentTab => currentTab.text() === label)

  if (tab === undefined) {
    throw new Error(`No tab labelled "${label}"`)
  }

  return tab
}
