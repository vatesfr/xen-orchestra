import VtsIconCell, { type IconCellProps } from '@core/components/table/cells/VtsIconCell.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderVtsHeaderCell } from '@core/tables/helpers/render-vts-header-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useIconColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderVtsHeaderCell(config?.headerIcon ?? 'fa:square-caret-down', config?.headerLabel),
  renderBody: (props: IconCellProps) => h(VtsIconCell, props),
}))
