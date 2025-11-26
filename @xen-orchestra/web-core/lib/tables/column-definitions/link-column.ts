import VtsLinkCell, { type VtsLinkCellProps } from '@core/components/table/cells/VtsLinkCell.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useLinkColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerIcon ?? 'fa:a', config?.headerLabel),
  renderBody: (link: { label: string } & VtsLinkCellProps) => {
    const { label, ...linkCellProps } = link

    return h(VtsLinkCell, linkCellProps, () => label)
  },
}))
