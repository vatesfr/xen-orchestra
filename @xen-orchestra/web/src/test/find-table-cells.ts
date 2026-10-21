import type { DOMWrapper, VueWrapper } from '@vue/test-utils'

type QueryableWrapper = Pick<VueWrapper, 'findAll'>

// Columns are read by their header label, never by position: a column added or moved does not shift the assertions
export function findTableHeaders(wrapper: QueryableWrapper): string[] {
  return wrapper.findAll('thead th').map(header => header.text())
}

export function findTableRows(wrapper: QueryableWrapper): DOMWrapper<Element>[] {
  return wrapper.findAll('tbody tr')
}

export function findTableRowTexts(wrapper: QueryableWrapper): string[] {
  return findTableRows(wrapper).map(row => row.text())
}

export function findTableColumnCells(wrapper: QueryableWrapper, headerLabel: string): DOMWrapper<Element>[] {
  const columnIndex = findTableHeaders(wrapper).indexOf(headerLabel)

  if (columnIndex === -1) {
    throw new Error(`No table column headed "${headerLabel}"`)
  }

  return findTableRows(wrapper).map(row => row.findAll('td')[columnIndex])
}

export function findTableColumn(wrapper: QueryableWrapper, headerLabel: string): string[] {
  return findTableColumnCells(wrapper, headerLabel).map(cell => cell.text())
}
