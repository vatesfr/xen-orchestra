import VtsNumberCell from '@core/components/table/cells/VtsNumberCell.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderVtsHeaderCell } from '@core/tables/helpers/render-vts-header-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useNumberColumn = defineColumn((headerConfig?: HeaderConfig) => ({
  renderHead: () => renderVtsHeaderCell(headerConfig?.headerIcon ?? 'fa:hashtag', headerConfig?.headerLabel),
  renderBody: (number?: number | string, unit?: string) => h(VtsNumberCell, { unit }, { default: () => number }),
}))
