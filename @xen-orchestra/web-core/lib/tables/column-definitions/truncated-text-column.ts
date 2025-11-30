import VtsTruncatedTextCell from '@core/components/table/cells/VtsTruncatedTextCell.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useTruncatedTextColumn = defineColumn((config?: HeaderConfig & { limit?: number }) => ({
  renderHead: () => renderHeadCell(config?.headerIcon ?? 'fa:align-left', config?.headerLabel),
  renderBody: (content: string) => h(VtsTruncatedTextCell, { content, limit: config?.limit }),
}))
