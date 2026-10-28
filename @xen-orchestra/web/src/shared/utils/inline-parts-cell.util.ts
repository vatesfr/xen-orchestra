import InlineParts from '@/shared/components/InlineParts.vue'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { h } from 'vue'

export function renderInlinePartsCell(parts: string[]) {
  return renderBodyCell(() => h(InlineParts, () => parts.map(part => h('span', { key: part }, part))))
}
