import VtsInlineParts from '@core/components/inline-parts/VtsInlineParts.vue'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { h } from 'vue'

export function renderInlinePartsCell(parts: string[]) {
  return renderBodyCell(() => h(VtsInlineParts, () => parts.map(part => h('span', { key: part }, part))))
}
