import { renderSizeCell } from '@/shared/utils/size-cell.util.ts'
import { h } from 'vue'

describe('renderSizeCell', () => {
  it('renders the size with one decimal and its unit apart', () => {
    const cell = h('span')
    const renderer = vi.fn(() => cell)

    expect(renderSizeCell(1.56 * 1024 ** 3, renderer)).toBe(cell)
    expect(renderer).toHaveBeenCalledExactlyOnceWith(1.6, 'GiB')
  })
})
