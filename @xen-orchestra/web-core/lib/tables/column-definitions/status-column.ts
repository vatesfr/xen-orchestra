import VtsStatusCell, { type StatusCellProps } from '@core/components/table/cells/VtsStatusCell.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderVtsHeaderCell } from '@core/tables/helpers/render-vts-header-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'

export const useStatusColumn = defineColumn((config?: HeaderConfig & Omit<StatusCellProps, 'statuses'>) => {
  const { t } = useI18n()

  return {
    renderHead: () => renderVtsHeaderCell(config?.headerIcon ?? 'fa:power-off', config?.headerLabel ?? t('status')),
    renderBody: (statuses?: StatusCellProps['statuses']) =>
      h(VtsStatusCell, { statuses, iconOnly: config?.iconOnly, progressiveSize: config?.progressiveSize }),
  }
})
