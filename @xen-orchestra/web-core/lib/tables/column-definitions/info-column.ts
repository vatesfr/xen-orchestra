import type { InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useInfoColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerLabel),
  renderBody: (label: string, accent: InfoAccent) => renderBodyCell(() => h(UiInfo, { accent }, () => label)),
}))
