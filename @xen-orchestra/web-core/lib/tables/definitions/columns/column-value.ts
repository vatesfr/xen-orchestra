import { icon } from '@core/icons/index.ts'
import { defineBodyCellRenderer, defineHeaderCellRenderer } from '@core/packages/table'

export const ValueHeader = defineHeaderCellRenderer({
  component: () => import('@core/components/table/VtsHeaderCell.vue'),
  props: ({ label }: { label: string }) => ({
    label,
    icon: icon('fa:square-caret-down'),
  }),
})

export const ValueBody = defineBodyCellRenderer({
  component: () => import('@core/components/table/body-cells/VtsTextCell.vue'),
  props: ({ value }: { value: string | number }) => ({ text: String(value) }),
})
