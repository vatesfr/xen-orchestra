import { icon } from '@core/icons/index.ts'
import { defineBodyCellRenderer, defineHeaderCellRenderer } from '@core/packages/table'

export const TextHeader = defineHeaderCellRenderer({
  component: () => import('@core/components/table/VtsHeaderCell.vue'),
  props: ({ label }: { label: string }) => ({ label, icon: icon('fa:align-left') }),
})

export const TextBody = defineBodyCellRenderer({
  component: () => import('@core/components/table/body-cells/VtsTextCell.vue'),
  props: ({ text }: { text: string | number }) => ({ text }),
})
