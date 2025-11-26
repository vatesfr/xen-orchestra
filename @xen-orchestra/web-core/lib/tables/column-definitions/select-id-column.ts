import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useSelectIdColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerIcon, config?.headerLabel),
  renderBody: (onSelect: () => void) =>
    renderBodyCell(
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
