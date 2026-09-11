import type { VueWrapper } from '@vue/test-utils'

type QueryableWrapper = Pick<VueWrapper, 'findAll'>

/**
 * Reads every `VtsTabularKeyValueRow` / `VtsKeyValueRow` of a mounted component
 * as a plain `{ label: value }` record, so a single assertion can cover all the
 * rows a user sees — and fail loudly when a value lands under the wrong label.
 *
 * Rows sharing the same label collapse into one entry: query those directly.
 */
export function findLabelledValues(wrapper: QueryableWrapper): Record<string, string> {
  const rows = wrapper.findAll('.vts-tabular-key-value-row, .vts-key-value-row')

  return Object.fromEntries(rows.map(row => [row.get('dt.label').text(), row.get('dd.value').text()]))
}

/**
 * Same as {@link findLabelledValues}, for the `VtsCardRowKeyValue` rows used by
 * the side-panel cards.
 */
export function findCardLabelledValues(wrapper: QueryableWrapper): Record<string, string> {
  const rows = wrapper.findAll('.vts-card-row-key-value')

  return Object.fromEntries(rows.map(row => [row.get('.key').text(), row.get('.value').text()]))
}

/**
 * Reads every `UiLegend` of a mounted component as ordered `[label, value]`
 * pairs — the donut and progress-bar cards render their values through it.
 *
 * Pairs rather than a record: a card may legend the same label twice, and the
 * order it lists them in is part of what a user reads.
 */
export function findLegends(wrapper: QueryableWrapper): [string, string][] {
  const legends = wrapper.findAll('.ui-legend')

  return legends.map(legend => [legend.get('.label').text(), legend.get('.value-and-unit').text()])
}

/**
 * Same as {@link findLegends}, for the `UiCardNumbers` a dashboard card lays out
 * next to its progress bar or donut. `.values` holds the number and, when the
 * card passes a `max`, the percentage above it.
 */
export function findCardNumbers(wrapper: QueryableWrapper): [string, string][] {
  const cards = wrapper.findAll('.ui-card-numbers')

  return cards.map(card => [card.get('.label').text(), card.get('.values').text()])
}
