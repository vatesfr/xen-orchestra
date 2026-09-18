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
 * Same as {@link findLabelledValues}, reading the href of the rows whose value
 * is a link rather than their text. Rows without a link are left out, so the
 * result names *which* rows link somewhere instead of relying on the position
 * of the linked one.
 */
export function findLabelledLinks(wrapper: QueryableWrapper): Record<string, string | undefined> {
  const rows = wrapper.findAll('.vts-tabular-key-value-row, .vts-key-value-row')

  return Object.fromEntries(
    rows.flatMap(row => {
      const link = row.find('dd.value a')

      return link.exists() ? [[row.get('dt.label').text(), link.attributes('href')]] : []
    })
  )
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
 * The label of every `VtsCardRowKeyValue` a card lays out, in order — which is
 * what says a row is *there*, and where, when {@link findCardLabelledValues}
 * collapses the rows a list repeats under one label.
 */
export function findCardLabels(wrapper: QueryableWrapper): string[] {
  return wrapper.findAll('.vts-card-row-key-value').map(row => row.get('.key').text())
}

/**
 * The values a card lists under `label`: that row and the unlabelled ones that
 * follow it, since a list labels only its first row. Stops at the next labelled
 * row, so a card laying out several lists reads each one on its own.
 */
export function findCardLabelledList(wrapper: QueryableWrapper, label: string): string[] {
  const rows = wrapper.findAll('.vts-card-row-key-value')
  const firstIndex = rows.findIndex(row => row.get('.key').text() === label)

  if (firstIndex === -1) {
    return []
  }

  const lastIndex = rows.findIndex((row, index) => index > firstIndex && row.get('.key').text() !== '')

  return rows.slice(firstIndex, lastIndex === -1 ? undefined : lastIndex).map(row => row.get('.value').text())
}

/**
 * The value element of the `VtsCardRowKeyValue` labelled `label`, so a test can
 * query inside it — an icon, a link — without reaching the copy buttons and
 * other addons the row lays out beside it.
 */
export function findCardValue(wrapper: QueryableWrapper, label: string) {
  const rows = wrapper.findAll('.vts-card-row-key-value')

  return rows[rows.findIndex(row => row.get('.key').text() === label)].get('.value')
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
 * Same as {@link findLegends}, for a card laying out several titled
 * `VtsDonutChartWithLegend` — each section read as `[title, legends]`, so the
 * assertion says which breakdown a value belongs to instead of running them all
 * into one flat list.
 *
 * Only for donuts given a `title`: an untitled one has no `.ui-legend-title`,
 * and a card holding a single donut reads with {@link findLegends}.
 */
export function findLegendSections(wrapper: QueryableWrapper): [string, [string, string][]][] {
  const sections = wrapper.findAll('.vts-donut-chart-with-legend')

  return sections.map(section => [section.get('.ui-legend-title').text(), findLegends(section)])
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
