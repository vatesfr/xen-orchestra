import type { IconCellProps } from '@core/components/table/body-cells/VtsIconCell.vue'
import { icon } from '@core/icons/index.ts'
import { defineBodyCellRenderer, defineHeaderCellRenderer } from '@core/packages/table'

export const IconHeader = defineHeaderCellRenderer({
  component: () => import('@core/components/table/VtsHeaderCell.vue'),
  props: ({ label }: { label: string }) => ({ label, icon: icon('fa:square-caret-down') }),
})

export const IconBody = defineBodyCellRenderer({
  component: () => import('@core/components/table/body-cells/VtsIconCell.vue'),
  props: (props: IconCellProps) => props,
})
