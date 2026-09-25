import type { VueWrapper } from '@vue/test-utils'

type QueryableWrapper = Pick<VueWrapper, 'findAll'>

type PairSelectors = { root: string; label: string; value: string }

/**
 * The reading strategy every helper below shares. Selectors travel in an object
 * rather than positionally: transposing `label` and `value` would still
 * typecheck and still produce plausible-looking output.
 */
function findPairs(wrapper: QueryableWrapper, { root, label, value }: PairSelectors): [string, string][] {
  return wrapper.findAll(root).map(element => [element.get(label).text(), element.get(value).text()])
}

/**
 * Reads every `VtsTabularKeyValueRow` / `VtsKeyValueRow` of a mounted component
 * as a plain `{ label: value }` record, so a single assertion can cover all the
 * rows a user sees — and fail loudly when a value lands under the wrong label.
 *
 * Rows sharing the same label collapse into one entry: query those directly.
 */
export function findLabelledValues(wrapper: QueryableWrapper): Record<string, string> {
  const selectors = { root: '.vts-tabular-key-value-row, .vts-key-value-row', label: 'dt.label', value: 'dd.value' }

  return Object.fromEntries(findPairs(wrapper, selectors))
}

/**
 * Same as {@link findLabelledValues}, for the `VtsCardRowKeyValue` rows used by
 * the side-panel cards.
 */
export function findCardLabelledValues(wrapper: QueryableWrapper): Record<string, string> {
  return Object.fromEntries(findPairs(wrapper, { root: '.vts-card-row-key-value', label: '.key', value: '.value' }))
}

/**
 * Reads every `UiLegend` of a mounted component as ordered `[label, value]`
 * pairs — the donut and progress-bar cards render their values through it.
 *
 * Pairs rather than a record: a card may legend the same label twice, and the
 * order it lists them in is part of what a user reads.
 */
export function findLegends(wrapper: QueryableWrapper): [string, string][] {
  return findPairs(wrapper, { root: '.ui-legend', label: '.label', value: '.value-and-unit' })
}

/**
 * Same as {@link findLegends}, but grouped by `VtsProgressBarGroup`: a card that
 * renders several groups needs to know which group a legend landed in, where a
 * flat list of legends would not say.
 */
export function findProgressBarGroupLegends(wrapper: QueryableWrapper): [string, string][][] {
  const sections = wrapper.findAll('.vts-progress-bar-group')

  return sections.map(section => findLegends(section))
}

/**
 * Same as {@link findLegends}, for the `UiCardNumbers` a dashboard card lays out
 * next to its progress bar or donut. `.values` holds the number and, when the
 * card passes a `max`, the percentage above it.
 */
export function findCardNumbers(wrapper: QueryableWrapper): [string, string][] {
  return findPairs(wrapper, { root: '.ui-card-numbers', label: '.label', value: '.values' })
}

/**
 * Reads the `tbody` of a mounted table as one array of cell texts per row.
 *
 * Cells rather than each row's whole text: `row.text()` concatenates the
 * columns, so a patch named `XSAPATCH-1` at version `1.0` and one named
 * `XSAPATCH-11` at version `.0` would read the same.
 */
export function findTableRows(wrapper: QueryableWrapper): string[][] {
  const rows = wrapper.findAll('tbody tr')

  return rows.map(row => row.findAll('td').map(cell => cell.text()))
}

/**
 * Reads every `UiTag` of a mounted component as its text, in the order the
 * component lists them.
 */
export function findTags(wrapper: QueryableWrapper): string[] {
  const tags = wrapper.findAll('.ui-tag')

  return tags.map(tag => tag.text())
}
