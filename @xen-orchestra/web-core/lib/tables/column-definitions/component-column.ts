import VtsActionCell from '@core/components/table/cells/VtsActionCell.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h, type Component } from 'vue'

export const useComponentColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerLabel),
  renderBody: (onClick: () => void, component: Component, props?: Record<string, unknown>) =>
    h(VtsActionCell, { buttonIcon: 'fa:eye', onClick }, () => h(component, props)),
}))
