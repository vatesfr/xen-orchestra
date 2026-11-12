import { renderInlinePartsCell } from '@/shared/utils/inline-parts-cell.util.ts'
import { findInlineParts } from '@/test/find-parts.ts'
import { mount } from '@vue/test-utils'

function mountCell(parts: string[]) {
  return mount({ render: () => renderInlinePartsCell(parts) })
}

describe('renderInlinePartsCell', () => {
  it('lays out each part of the cell on one line', () => {
    expect(findInlineParts(mountCell(['PG-Prod', 'VLAN 10']))).toEqual(['PG-Prod', 'VLAN 10'])
  })

  it('lays out nothing without parts', () => {
    expect(findInlineParts(mountCell([]))).toEqual([])
  })
})
