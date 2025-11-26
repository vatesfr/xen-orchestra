import VtsTagCell from '@core/components/table/cells/VtsTagCell.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import type { MaybeArray } from '@core/types/utility.type'
import { h } from 'vue'

export const useTagColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerIcon ?? 'fa:square-caret-down', config?.headerLabel),
  renderBody: (tag: MaybeArray<string>) => h(VtsTagCell, { tag }),
}))
