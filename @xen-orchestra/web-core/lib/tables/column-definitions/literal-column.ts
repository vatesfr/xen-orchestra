import { defineColumn } from '@core/packages/table/define-column'
import { renderUiTableCell } from '@core/tables/helpers/render-ui-table-cell'
import { renderVtsHeaderCell } from '@core/tables/helpers/render-vts-header-cell'
import type { HeaderConfig } from '@core/tables/types.ts'

export const useLiteralColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderVtsHeaderCell(config?.headerIcon ?? 'fa:square-caret-down', config?.headerLabel),
  renderBody: (value: any) => renderUiTableCell(() => value),
}))
