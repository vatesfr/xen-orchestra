import VtsLinkCell, { type VtsLinkCellProps } from '@core/components/table/cells/VtsLinkCell.vue'
import VtsTextCell from '@core/components/table/cells/VtsTextCell.vue'
import { defineColumn } from '@core/packages/table'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useLinkOrTextColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerIcon, config?.headerLabel),
  renderBody: (link: { label: string; suffix?: string } & VtsLinkCellProps) => {
    const { label, suffix, ...linkCellProps } = link

    if (!linkCellProps.href && !linkCellProps.to) {
      return h(VtsTextCell, () => label)
    }

    return h(VtsLinkCell, linkCellProps, {
      default: () => label,
      suffix: suffix ? () => h('span', suffix) : undefined,
    })
  },
}))
