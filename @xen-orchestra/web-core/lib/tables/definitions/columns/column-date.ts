import { icon } from '@core/icons/index.ts'
import { defineBodyCellRenderer, defineHeaderCellRenderer } from '@core/packages/table'

export const DateHeader = defineHeaderCellRenderer({
  component: () => import('@core/components/table/VtsHeaderCell.vue'),
  props: ({ label }: { label: string }) => ({ label, icon: icon('fa:calendar') }),
})

export const DateBody = defineBodyCellRenderer({
  component: () => import('@core/components/table/body-cells/VtsDateCell.vue'),
  props: ({ date }: { date: Date | string | number }) => ({ date }),
})
