import VtsCollapsedListCell from '@core/components/table/cells/VtsCollapsedListCell.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderVtsHeaderCell } from '@core/tables/helpers/render-vts-header-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'
import { h } from 'vue'

export const useAddressColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderVtsHeaderCell(config?.headerIcon ?? 'fa:at', config?.headerLabel),
  renderBody: (addresses: MaybeArray<string>) => h(VtsCollapsedListCell, { items: toArray(addresses) }),
}))
