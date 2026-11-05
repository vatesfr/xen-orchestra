import VtsTagCell from '@core/components/table/cells/VtsTagCell.vue'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import type { MaybeArray } from '@core/types/utility.type.ts'
import { h } from 'vue'

export const useTagColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerLabel),
  renderBody: (tag: MaybeArray<string>, accent: TagAccent = 'info') => h(VtsTagCell, { tag, accent }),
}))
