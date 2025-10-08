import type { ButtonCellProps } from '@core/components/table/body-cells/VtsButtonCell.vue'
import { defineBodyCellRenderer, defineHeaderCellRenderer } from '@core/packages/table'

export const ButtonHeader = defineHeaderCellRenderer({
  component: () => import('@core/components/table/VtsHeaderCell.vue'),
  props: () => ({ label: '' }),
})

export const ButtonBody = defineBodyCellRenderer({
  component: () => import('@core/components/table/body-cells/VtsButtonCell.vue'),
  props: (props: ButtonCellProps) => props,
})
