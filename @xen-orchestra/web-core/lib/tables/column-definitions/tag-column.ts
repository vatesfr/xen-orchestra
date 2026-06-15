import VtsTagCell from '@core/components/table/cells/VtsTagCell.vue'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'
import { h } from 'vue'

export const useTagColumn = defineColumn((config?: HeaderConfig & { getAccent?: (value: string) => TagAccent }) => ({
  renderHead: () => renderHeadCell(config?.headerIcon ?? 'fa:square-caret-down', config?.headerLabel),
  renderBody: (tag: MaybeArray<string>) =>
    h(VtsTagCell, {
      tag,
      accent: config?.getAccent?.(toArray(tag)[0]) ?? 'info',
    }),
}))
