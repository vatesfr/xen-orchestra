import VtsProgressBarCell from '@core/components/table/cells/VtsProgressBarCell.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useProgressBarColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerIcon ?? 'fa:hashtag', config?.headerLabel),
  renderBody: (current: number, total: number) => h(VtsProgressBarCell, { current, total }),
}))
