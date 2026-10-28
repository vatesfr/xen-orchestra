import { renderInlinePartsCell } from '@/shared/utils/inline-parts-cell.util.ts'
import { findParts } from '@/test/find-parts.ts'
import { mount } from '@vue/test-utils'

function mountCell(parts: string[]) {
  return mount({ render: () => renderInlinePartsCell(parts) })
}

describe('renderInlinePartsCell', () => {
  it('lays out each part of the cell on one line', () => {
    expect(findParts(mountCell(['PG-Prod', 'VLAN 10']), '.inline-parts')).toEqual(['PG-Prod', 'VLAN 10'])
  })

  it('lays out nothing without parts', () => {
    expect(findParts(mountCell([]), '.inline-parts')).toEqual([])
  })
})
