import type { InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import { icon } from '@core/icons/index.ts'
import { defineBodyCellRenderer, defineHeaderCellRenderer } from '@core/packages/table'

export const InfoHeader = defineHeaderCellRenderer({
  component: () => import('@core/components/table/VtsHeaderCell.vue'),
  props: ({ label }: { label: string }) => ({ label, icon: icon('fa:square-caret-down') }),
})

export const InfoBody = defineBodyCellRenderer({
  component: () => import('@core/components/table/body-cells/VtsInfoCell.vue'),
  props: ({ info }: { info: string | { label: string; accent: InfoAccent } }) =>
    typeof info === 'object' ? info : { label: info, accent: 'info' as const },
})
