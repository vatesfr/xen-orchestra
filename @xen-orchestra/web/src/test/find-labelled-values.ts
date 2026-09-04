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
