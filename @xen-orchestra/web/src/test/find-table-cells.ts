import type { DOMWrapper, VueWrapper } from '@vue/test-utils'

type QueryableWrapper = Pick<VueWrapper, 'findAll'>

// Columns are read by their header label, never by position: a column added or moved does not shift the assertions
export function findTableHeaders(wrapper: QueryableWrapper): string[] {
  return wrapper.findAll('thead th').map(header => header.text())
}

function findTableRowElements(wrapper: QueryableWrapper): DOMWrapper<Element>[] {
  return wrapper.findAll('tbody tr')
}

export function findTableColumnCells(wrapper: QueryableWrapper, headerLabel: string): DOMWrapper<Element>[] {
  const columnIndex = findTableHeaders(wrapper).indexOf(headerLabel)

  if (columnIndex === -1) {
    throw new Error(`No table column headed "${headerLabel}"`)
  }

  return findTableRowElements(wrapper).map(row => row.findAll('td')[columnIndex])
}

export function findTableColumn(wrapper: QueryableWrapper, headerLabel: string): string[] {
  return findTableColumnCells(wrapper, headerLabel).map(cell => cell.text())
}
