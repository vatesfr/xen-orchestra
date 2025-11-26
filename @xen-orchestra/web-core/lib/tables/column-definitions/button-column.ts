import UiButton, {
  type ButtonAccent,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from '@core/components/ui/button/UiButton.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderUiTableCell } from '@core/tables/helpers/render-ui-table-cell'
import { renderVtsHeaderCell } from '@core/tables/helpers/render-vts-header-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h, toValue, type MaybeRefOrGetter } from 'vue'

export const useButtonColumn = defineColumn(
  (
    config?: HeaderConfig & {
      buttonAccent?: MaybeRefOrGetter<ButtonAccent>
      buttonVariant?: MaybeRefOrGetter<ButtonVariant>
      buttonSize?: MaybeRefOrGetter<ButtonSize>
    }
  ) => ({
    renderHead: () => renderVtsHeaderCell(config?.headerIcon, config?.headerLabel),
    renderBody: (label: string, onClick: () => void, props?: Partial<ButtonProps>) =>
      renderUiTableCell(() =>
        h(
          UiButton,
          {
            accent: toValue(config?.buttonAccent) ?? 'brand',
            variant: toValue(config?.buttonVariant) ?? 'primary',
            size: toValue(config?.buttonSize) ?? 'medium',
            ...props,
            onClick,
          },
          { default: () => label }
        )
      ),
  })
)
