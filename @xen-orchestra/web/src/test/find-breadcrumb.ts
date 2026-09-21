import type { VueWrapper } from '@vue/test-utils'

type QueryableWrapper = Pick<VueWrapper, 'findAll'>

/**
 * Reads the `UiBreadcrumb` of a mounted header as the trail a user walks back
 * through: one `[label, href]` pair per linked step, in order.
 *
 * Only the linked steps: the object the page is about closes the trail as plain
 * text, and what it renders beside its name — a state icon — belongs to the
 * component, not to the breadcrumb.
 */
export function findBreadcrumbLinks(wrapper: QueryableWrapper): [string, string | undefined][] {
  return wrapper.findAll('.ui-breadcrumb a').map(link => [link.text(), link.attributes('href')])
}
