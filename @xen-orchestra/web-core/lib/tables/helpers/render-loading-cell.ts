import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { h } from 'vue'

export const renderLoadingCell = () => h(UiTableCell, { align: 'center' }, () => h(UiLoader))
