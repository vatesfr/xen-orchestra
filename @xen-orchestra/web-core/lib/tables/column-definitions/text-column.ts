import VtsMiddleEllipsis from '@core/components/middle-ellipsis/VtsMiddleEllipsis.vue'
import type { TextCellProps } from '@core/components/table/cells/VtsTextCell.vue'
import VtsTextCell from '@core/components/table/cells/VtsTextCell.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { FlexibleColumnConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useTextColumn = defineColumn((config?: FlexibleColumnConfig) => ({
  renderHead: () => renderHeadCell(config?.headerLabel),
  renderBody: (content: string, props?: TextCellProps) =>
    h(VtsTextCell, { ...props, flexible: config?.flexible }, () =>
      config?.flexible ? h(VtsMiddleEllipsis, { text: content }) : content
    ),
}))
