import type { IconName } from '@core/icons'
import { defineBodyCellRenderer, defineHeaderCellRenderer } from '@core/packages/table'

export const ButtonIconHeader = defineHeaderCellRenderer({
  component: () => import('@core/components/table/VtsHeaderCell.vue'),
  props: () => ({ label: '' }),
})

export const ButtonIconBody = defineBodyCellRenderer({
  component: () => import('@core/components/table/body-cells/VtsButtonIconCell.vue'),
  props: (config: { icon: IconName; handler: () => void }) => config,
})
