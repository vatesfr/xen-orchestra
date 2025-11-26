import VtsLinkCell, { type VtsLinkCellProps } from '@core/components/table/cells/VtsLinkCell.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderVtsHeaderCell } from '@core/tables/helpers/render-vts-header-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useLinkColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderVtsHeaderCell(config?.headerIcon ?? 'fa:a', config?.headerLabel),
  renderBody: (link: { label: string } & VtsLinkCellProps) => {
    const { label, ...props } = link

    return h(VtsLinkCell, props, () => label)
  },
}))
