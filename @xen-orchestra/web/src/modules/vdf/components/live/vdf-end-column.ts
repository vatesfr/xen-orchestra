import type { HeaderConfig } from '@core/tables/types.ts'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { VNode } from 'vue'

// numbers with their unit or detail (rates, counts): aligned to the end
export const useEndColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerLabel),
  renderBody: (content: VNode | string) => renderBodyCell(() => content, 'end'),
}))
