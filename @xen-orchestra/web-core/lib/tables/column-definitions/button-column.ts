import UiButton, {
  type ButtonAccent,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from '@core/components/ui/button/UiButton.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h, toValue, type MaybeRefOrGetter } from 'vue'

type ButtonConfig = {
  buttonAccent?: MaybeRefOrGetter<ButtonAccent>
  buttonVariant?: MaybeRefOrGetter<ButtonVariant>
  buttonSize?: MaybeRefOrGetter<ButtonSize>
}

export const useButtonColumn = defineColumn((config?: HeaderConfig & ButtonConfig) => ({
  renderHead: () => renderHeadCell(config?.headerLabel),
  renderBody: (label: string, onClick: () => void, props?: Partial<ButtonProps>) =>
    renderBodyCell(() =>
      h(
        UiButton,
        {
          accent: toValue(config?.buttonAccent) ?? 'brand',
          variant: toValue(config?.buttonVariant) ?? 'primary',
          size: toValue(config?.buttonSize) ?? 'medium',
          ...props,
          onClick,
        },
        () => label
      )
    ),
}))
