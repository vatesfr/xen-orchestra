import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { h } from 'vue'

export const renderUiTableCell = (content?: () => any, align?: 'center' | 'end') =>
  h(UiTableCell, { align }, { default: () => content?.() })
