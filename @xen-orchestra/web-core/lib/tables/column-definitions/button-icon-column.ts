import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import UiButtonIcon, {
  type ButtonIconAccent,
  type ButtonIconSize,
} from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import type { IconName } from '@core/icons'
import { defineColumn } from '@core/packages/table/define-column.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h, type MaybeRefOrGetter, toValue } from 'vue'

export type ButtonIconConfig = {
  buttonIcon: MaybeRefOrGetter<IconName>
  buttonSize?: MaybeRefOrGetter<ButtonIconSize>
  buttonAccent?: MaybeRefOrGetter<ButtonIconAccent>
}

const COLUMN_WIDTH = '6rem'

export const useButtonIconColumn = defineColumn((config: HeaderConfig & ButtonIconConfig) => ({
  renderHead: () => h(VtsHeaderCell, { style: { width: COLUMN_WIDTH } }, () => toValue(config.headerLabel)),
  renderBody: (onClick: (() => void) | undefined) => {
    if (onClick === undefined) {
      return h(UiTableCell, { style: { width: COLUMN_WIDTH } })
    }

    return h(UiTableCell, { align: 'center', style: { width: COLUMN_WIDTH } }, () =>
      h(UiButtonIcon, {
        icon: toValue(config.buttonIcon),
        accent: toValue(config.buttonAccent) ?? 'brand',
        size: toValue(config.buttonSize) ?? 'small',
        targetScale: 1.5,
        onClick,
      })
    )
  },
}))
