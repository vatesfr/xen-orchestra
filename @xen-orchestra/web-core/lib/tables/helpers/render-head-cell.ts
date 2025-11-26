import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import type { IconName } from '@core/icons/index.ts'
import { h, toValue, type MaybeRefOrGetter } from 'vue'

export const renderHeadCell = (icon?: MaybeRefOrGetter<IconName>, label?: MaybeRefOrGetter<string | undefined>) =>
  h(VtsHeaderCell, { icon: toValue(icon) }, () => toValue(label))
