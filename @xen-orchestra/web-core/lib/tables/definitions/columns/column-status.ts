import type { StatusCellProps } from '@core/components/table/body-cells/VtsStatusCell.vue'
import { icon } from '@core/icons/index.ts'
import { defineBodyCellRenderer, defineHeaderCellRenderer } from '@core/packages/table'

export const StatusHeader = defineHeaderCellRenderer({
  component: () => import('@core/components/table/VtsHeaderCell.vue'),
  props: ({ label }: { label: string }) => ({ label, icon: icon('fa:power-off') }),
})

export const StatusBody = defineBodyCellRenderer({
  component: () => import('@core/components/table/body-cells/VtsStatusCell.vue'),
  props: (props: StatusCellProps) => props,
})
