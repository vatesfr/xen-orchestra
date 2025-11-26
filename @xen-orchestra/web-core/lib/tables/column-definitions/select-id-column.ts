import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderUiTableCell } from '@core/tables/helpers/render-ui-table-cell'
import { renderVtsHeaderCell } from '@core/tables/helpers/render-vts-header-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useSelectIdColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderVtsHeaderCell(config?.headerIcon, config?.headerLabel),
  renderBody: (onSelect: () => void) =>
    renderUiTableCell(
      () =>
        h(UiButtonIcon, {
          accent: 'brand',
          size: 'small',
          icon: 'fa:eye',
          onClick: () => onSelect(),
          targetScale: 1.8,
        }),
      'center'
    ),
}))
