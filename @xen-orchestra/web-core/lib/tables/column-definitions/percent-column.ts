import VtsNumberCell from '@core/components/table/cells/VtsNumberCell.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'

export const usePercentColumn = defineColumn((headerConfig?: HeaderConfig) => {
  const { n } = useI18n()

  return {
    renderHead: () => renderHeadCell(headerConfig?.headerLabel),
    renderBody: (number: number) => h(VtsNumberCell, () => n(number, 'percent')),
  }
})
