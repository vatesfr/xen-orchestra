import UiTableCell, { type TableCellAlign } from '@core/components/ui/table-cell/UiTableCell.vue'
import { h } from 'vue'

export const renderBodyCell = (content?: () => any, align?: TableCellAlign) => h(UiTableCell, { align }, content)
