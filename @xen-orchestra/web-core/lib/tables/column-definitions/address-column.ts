import VtsCollapsedListCell from '@core/components/table/cells/VtsCollapsedListCell.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'
import { h } from 'vue'

export const useAddressColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerIcon ?? 'fa:at', config?.headerLabel),
  renderBody: (addresses: MaybeArray<string>) => h(VtsCollapsedListCell, { items: toArray(addresses) }),
}))
