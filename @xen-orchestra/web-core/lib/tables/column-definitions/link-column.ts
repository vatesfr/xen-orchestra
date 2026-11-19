import VtsMiddleEllipsis from '@core/components/middle-ellipsis/VtsMiddleEllipsis.vue'
import VtsLinkCell, { type VtsLinkCellProps } from '@core/components/table/cells/VtsLinkCell.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { FlexibleColumnConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useLinkColumn = defineColumn((config?: FlexibleColumnConfig) => ({
  renderHead: () => renderHeadCell(config?.headerLabel),
  renderBody: (link: { label: string } & VtsLinkCellProps) => {
    const { label, ...linkCellProps } = link

    return h(VtsLinkCell, { ...linkCellProps, flexible: config?.flexible }, () =>
      config?.flexible ? h(VtsMiddleEllipsis, { text: label }) : label
    )
  },
}))
