import UiButtonIcon, {
  type ButtonIconAccent,
  type ButtonIconSize,
} from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import type { IconName } from '@core/icons'
import { defineColumn } from '@core/packages/table/define-column'
import { renderVtsHeaderCell } from '@core/tables/helpers/render-vts-header-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h, toValue, type MaybeRefOrGetter } from 'vue'

export const useButtonIconColumn = defineColumn(
  (
    config: HeaderConfig & {
      buttonIcon: MaybeRefOrGetter<IconName>
      buttonSize?: MaybeRefOrGetter<ButtonIconSize>
      buttonAccent?: MaybeRefOrGetter<ButtonIconAccent>
    }
  ) => ({
    renderHead: () => renderVtsHeaderCell(config.headerIcon, config.headerLabel),
    renderBody: (onClick: () => void) =>
      h(
        UiTableCell,
        { align: 'center', style: 'width: 6rem' },
        {
          default: () =>
            h(UiButtonIcon, {
              icon: toValue(config.buttonIcon),
              accent: toValue(config.buttonAccent) ?? 'brand',
              size: toValue(config.buttonSize) ?? 'small',
              targetScale: 1.5,
              onClick,
            }),
        }
      ),
  })
)
