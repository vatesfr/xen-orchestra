import type { DOMWrapper, VueWrapper } from '@vue/test-utils'

type QueryableWrapper = Pick<VueWrapper, 'findAll'>

function findHeaderLabels(wrapper: QueryableWrapper) {
  return wrapper.findAll('thead th').map(header => header.text())
}

/**
 * Reads every body row of a mounted table as a `{ column label: value }` record,
 * so a single assertion covers a whole row and fails loudly when a value lands
 * under the wrong column.
 *
 * Columns sharing a label — the unlabelled ones, such as an actions column —
 * collapse into one entry: reach those with {@link findTableCell}.
 */
export function findTableRows(wrapper: QueryableWrapper): Record<string, string>[] {
  const labels = findHeaderLabels(wrapper)

  return wrapper
    .findAll('tbody tr')
    .map(row => Object.fromEntries(row.findAll('td').map((cell, index) => [labels[index], cell.text()])))
}

/**
 * The cell of `row` under the column labelled `column`, so a test can query
 * inside it — a link, a list, an icon — without counting `td`s.
 */
export function findTableCell(
  wrapper: QueryableWrapper,
  { row, column }: { row: number; column: string }
): DOMWrapper<Element> {
  const index = findHeaderLabels(wrapper).indexOf(column)

  return wrapper.findAll('tbody tr')[row].findAll('td')[index]
}
