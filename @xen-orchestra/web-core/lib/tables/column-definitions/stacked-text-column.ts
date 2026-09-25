import VtsStackedTextCell from '@core/components/table/cells/VtsStackedTextCell.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

/**
 * A primary text with a muted line below, e.g. a name and a short ID
 */
export const useStackedTextColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerLabel),
  renderBody: (primary: string, secondary?: string) => h(VtsStackedTextCell, { secondary }, () => primary),
}))
