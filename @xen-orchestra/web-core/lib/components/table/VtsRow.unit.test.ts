import VtsRow from '@core/components/table/VtsRow.vue'
import { mount } from '@vue/test-utils'

function mountRow(props: { selected?: boolean; error?: boolean; warning?: boolean } = {}) {
  return mount(VtsRow, { props, attachTo: document.createElement('tbody') })
}

it.each(['selected', 'error', 'warning'] as const)('marks the row as %s', state => {
  expect(mountRow({ [state]: true }).classes()).toContain(state)
})

it.each(['error', 'warning'] as const)('marks a selected row as %s too', state => {
  expect(mountRow({ selected: true, [state]: true }).classes()).toEqual(['vts-row', 'selected', state])
})

it('marks the row as nothing by default', () => {
  expect(mountRow().classes()).toEqual(['vts-row'])
})
