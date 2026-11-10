import type { LabelAccent } from '@core/components/ui/label/UiLabel.vue'
import { useMapper } from '@core/packages/mapper/use-mapper.ts'
import { IK_INPUT_WRAPPER_CONTROLLER } from '@core/utils/injection-keys.util.ts'
import { inject, type MaybeRefOrGetter, toValue, watchEffect } from 'vue'

export function useInputWrapperController<TAccent extends string>({
  accent,
  required,
  detached,
}: {
  accent: MaybeRefOrGetter<TAccent>
  required: MaybeRefOrGetter<boolean>
  detached?: boolean
}) {
  const wrapperController = detached ? undefined : inject(IK_INPUT_WRAPPER_CONTROLLER, undefined)

  const wrapperAccent = useMapper<LabelAccent, TAccent | 'warning' | 'danger'>(
    () => wrapperController?.labelAccent,
    () => ({
      neutral: toValue(accent),
      warning: 'warning',
      danger: 'danger',
    }),
    'neutral'
  )

  if (wrapperController) {
    watchEffect(() => {
      wrapperController.required = toValue(required)
    })
  }

  return { wrapperController, accent: wrapperAccent }
}
