import { defineColumn } from '@core/packages/table/define-column'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell'
import type { HeaderConfig } from '@core/tables/types.ts'

export const useLiteralColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerIcon ?? 'fa:square-caret-down', config?.headerLabel),
  renderBody: (value: any) => renderBodyCell(() => value),
}))
