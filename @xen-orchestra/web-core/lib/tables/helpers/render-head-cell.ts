import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import { h, type MaybeRefOrGetter, toValue } from 'vue'

export const renderHeadCell = (label?: MaybeRefOrGetter<string | undefined>) => h(VtsHeaderCell, () => toValue(label))
