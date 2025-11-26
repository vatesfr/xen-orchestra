import VtsProgressBarCell from '@core/components/table/cells/VtsProgressBarCell.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderVtsHeaderCell } from '@core/tables/helpers/render-vts-header-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useProgressBarColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderVtsHeaderCell(config?.headerIcon ?? 'fa:hashtag', config?.headerLabel),
  renderBody: (current: number, total: number) => h(VtsProgressBarCell, { current, total }),
}))
