import { unrefElement, useEventListener, whenever } from '@vueuse/core'
import { computed, inject, type MaybeRefOrGetter, ref, toValue } from 'vue'
import { type FormOption, IK_FORM_SELECT_CONTROLLER } from './types.ts'

export function useFormOptionController<TOption extends FormOption>(_option: MaybeRefOrGetter<TOption>) {
  const controller = inject(IK_FORM_SELECT_CONTROLLER)

  if (!controller) {
    throw new Error('useFormOption needs a FormSelectController to be injected')
  }

  const option = computed(() => toValue(_option))

  const elementRef = ref<HTMLDivElement>()

  whenever(
    () => option.value.flags.active,
    () => {
      unrefElement(elementRef)?.scrollIntoView({ block: 'nearest' })
    }
  )

  useEventListener(elementRef, 'click', event => {
    if (controller.isDisabled) {
      return
    }

    event.preventDefault()

    if (option.value.properties.disabled) {
      return
    }

    if (controller.isMultiple) {
      option.value.toggleFlag('selected')
      controller.focusSearchOrTrigger()
    } else {
      option.value.toggleFlag('selected', true)
      controller.closeDropdown(true)
    }
  })

  useEventListener(elementRef, 'mouseenter', () => {
    if (controller.isDisabled || option.value.properties.disabled || controller.isNavigatingWithKeyboard) {
      return
    }

    option.value.flags.active = true
  })

  return {
    elementRef,
  }
}
