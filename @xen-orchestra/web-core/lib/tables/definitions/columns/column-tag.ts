import { icon } from '@core/icons/index.ts'
import { defineBodyCellRenderer, defineHeaderCellRenderer } from '@core/packages/table'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'

export const TagHeader = defineHeaderCellRenderer({
  component: () => import('@core/components/table/VtsHeaderCell.vue'),
  props: ({ label }: { label: string }) => ({ label, icon: icon('fa:square-caret-down') }),
})

export const TagBody = defineBodyCellRenderer({
  component: () => import('@core/components/table/body-cells/VtsTagCell.vue'),
  props: ({ tags }: { tags: MaybeArray<string> }) => ({ tags: toArray(tags) }),
})
