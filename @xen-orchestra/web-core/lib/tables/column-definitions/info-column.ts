import type { InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderUiTableCell } from '@core/tables/helpers/render-ui-table-cell'
import { renderVtsHeaderCell } from '@core/tables/helpers/render-vts-header-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useInfoColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderVtsHeaderCell(config?.headerIcon ?? 'fa:square-caret-down', config?.headerLabel),
  renderBody: (label: string, accent: InfoAccent) =>
    renderUiTableCell(() => h(UiInfo, { accent }, { default: () => label })),
}))
