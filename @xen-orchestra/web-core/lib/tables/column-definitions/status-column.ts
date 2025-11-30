import VtsStatusCell, { type StatusCellProps } from '@core/components/table/cells/VtsStatusCell.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'

export const useStatusColumn = defineColumn((config?: HeaderConfig & Omit<StatusCellProps, 'status'>) => {
  const { t } = useI18n()
  const { headerIcon, headerLabel, ...statusCellProps } = config ?? {}

  return {
    renderHead: () => renderHeadCell(headerIcon ?? 'fa:square-caret-down', headerLabel ?? t('status')),
    renderBody: (status: StatusCellProps['status']) => h(VtsStatusCell, { status, ...statusCellProps }),
  }
})
