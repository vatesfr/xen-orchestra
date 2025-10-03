import { icon } from '@core/icons/index.ts'
import { defineBodyCellRenderer, defineHeaderCellRenderer } from '@core/packages/table'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'

export const AddressHeader = defineHeaderCellRenderer({
  component: () => import('@core/components/table/VtsHeaderCell.vue'),
  props: ({ label }: { label: string }) => ({ label, icon: icon('fa:at') }),
})

export const AddressBody = defineBodyCellRenderer({
  component: () => import('@core/components/table/body-cells/VtsCollapsedListCell.vue'),
  props: ({ addresses }: { addresses: MaybeArray<string> }) => ({ items: toArray(addresses) }),
})
