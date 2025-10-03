import { icon } from '@core/icons'
import { defineBodyCellRenderer, defineHeaderCellRenderer } from '@core/packages/table'

export const SelectIdHeader = defineHeaderCellRenderer({
  component: () => import('@core/components/table/VtsHeaderCell.vue'),
  props: () => ({ label: '' }),
})

export const SelectIdBody = defineBodyCellRenderer({
  component: () => import('@core/components/table/body-cells/VtsButtonIconCell.vue'),
  props: ({ onSelect }: { onSelect: () => void }) => ({ handler: onSelect, icon: icon('fa:eye') }),
})
