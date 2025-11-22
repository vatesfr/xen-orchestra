import { icon } from '@core/icons/index.ts'
import { defineBodyCellRenderer, defineHeaderCellRenderer } from '@core/packages/table'

export const NumberHeader = defineHeaderCellRenderer({
  component: () => import('@core/components/table/VtsHeaderCell.vue'),
  props: ({ label }: { label: string }) => ({ label, icon: icon('fa:hashtag') }),
})

export const NumberBody = defineBodyCellRenderer({
  component: () => import('@core/components/table/body-cells/VtsNumberCell.vue'),
  props: (value: { value: number | string; unit?: string }) => (typeof value === 'object' ? value : { value }),
})
