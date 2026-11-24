import type { InputWrapperAccent } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { IK_INPUT_WRAPPER_CONTROLLER } from '@core/utils/injection-keys.util.ts'
import { computed, inject, type MaybeRefOrGetter, toValue, watchEffect } from 'vue'

export const INPUT_WRAPPER_ACCENTS = ['neutral', 'success', 'warning', 'danger'] as const satisfies InputWrapperAccent[]

export function useInputWrapperController<TAccent extends string>({
  accent,
  accents,
  required,
  detached,
}: {
  accent: MaybeRefOrGetter<TAccent>
  accents: readonly NoInfer<TAccent>[]
  required?: MaybeRefOrGetter<boolean>
  detached?: boolean
}) {
  const wrapperController = detached ? undefined : inject(IK_INPUT_WRAPPER_CONTROLLER, undefined)

  // A neutral wrapper has no message to show: the input keeps its own accent
  const resolvedAccent = computed(() => {
    const wrapperAccent = wrapperController?.accent === 'neutral' ? undefined : wrapperController?.accent

    return accents.find(supportedAccent => supportedAccent === wrapperAccent) ?? toValue(accent)
  })

  if (wrapperController && required !== undefined) {
    watchEffect(() => {
      wrapperController.required = toValue(required)
    })
  }

  return { wrapperController, accent: resolvedAccent }
}
