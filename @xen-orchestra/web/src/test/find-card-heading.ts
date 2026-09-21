import type { VueWrapper } from '@vue/test-utils'

type QueryableWrapper = Pick<VueWrapper, 'get' | 'find'>

function readText(wrapper: Pick<VueWrapper, 'text'>) {
  return wrapper.text().replace(/\s+/g, ' ')
}

/**
 * The heading a `UiCardTitle` lays out: its title, the `info` it puts beside it
 * — a link, a counter — and the `description` under it, each left out when the
 * card does not fill that slot.
 *
 * One assertion then covers the whole heading, and fails when a card gains or
 * loses a description instead of silently ignoring it.
 *
 * Whitespace is collapsed, so a title laying out an element beside its text — a
 * counter — reads as one line instead of carrying the template's indentation.
 */
export function findCardHeading(wrapper: QueryableWrapper) {
  const heading = wrapper.get('.ui-card-title')
  const info = heading.find('.info')
  const description = heading.find('.description')

  return {
    title: readText(heading.get('.title')),
    ...(info.exists() && { info: readText(info) }),
    ...(description.exists() && { description: readText(description) }),
  }
}

/**
 * Everything a `UiCardTitle` shows, as one string — its title, the info beside
 * it and the description under it run together, the way `text()` concatenates a
 * subtree.
 *
 * {@link findCardHeading} is the sharper read: it says which part a wording
 * landed in. This one is for asserting a single wording is *somewhere* in the
 * heading, with `toContain`.
 */
export function findCardTitleText(wrapper: QueryableWrapper) {
  return readText(wrapper.get('.ui-card-title'))
}

/** Where the link a `UiCardTitle` puts beside its title navigates to. */
export function findCardTitleHref(wrapper: QueryableWrapper) {
  return wrapper.get('.ui-card-title .info a').attributes('href')
}

/**
 * The heading a `UiTitle` shows — the plain section title a card uses instead of
 * a `UiCardTitle` when it has nothing to put beside it.
 */
export function findTitleText(wrapper: QueryableWrapper) {
  return readText(wrapper.get('.ui-title'))
}
