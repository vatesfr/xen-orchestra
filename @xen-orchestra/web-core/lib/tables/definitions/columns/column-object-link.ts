import type { ObjectLinkCellProps } from '@core/components/table/body-cells/VtsObjectLinkCell.vue'
import { icon } from '@core/icons/index.ts'
import { defineBodyCellRenderer, defineHeaderCellRenderer } from '@core/packages/table'

export const ObjectLinkHeader = defineHeaderCellRenderer({
  component: () => import('@core/components/table/VtsHeaderCell.vue'),
  props: ({ label }: { label: string }) => ({ label, icon: icon('fa:a') }),
})

export const ObjectLinkBody = defineBodyCellRenderer({
  component: () => import('@core/components/table/body-cells/VtsObjectLinkCell.vue'),
  props: (props: ObjectLinkCellProps) => props,
})
