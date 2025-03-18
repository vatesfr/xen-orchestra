import { type FormOptionValue, IK_FORM_SELECT_CONTROLLER } from '@core/packages/form-select/form-select.type'
import { unrefElement, useEventListener, whenever } from '@vueuse/core'
import { computed, inject, type MaybeRefOrGetter, ref, toValue } from 'vue'

export function useFormOption(
  _value: MaybeRefOrGetter<FormOptionValue>,
  config?: { disabled?: MaybeRefOrGetter<boolean> }
) {
  const controller = inject(IK_FORM_SELECT_CONTROLLER)

  if (!controller) {
    throw new Error('useFormOption needs a FormSelectController to be injected')
  }

  const value = computed(() => toValue(_value))

  const elementRef = ref<HTMLDivElement>()

  const isActive = computed(() => controller.isOptionActive(value.value))

  whenever(isActive, () => {
    unrefElement(elementRef)?.scrollIntoView({ block: 'nearest' })
  })

  const isSelected = computed(() => controller.isOptionSelected(value.value))

  useEventListener(elementRef, 'click', () => {
    if (toValue(config?.disabled)) {
      return
    }

    if (controller.isMultiple) {
      controller.toggleOption(value.value)
    } else {
      controller.selectOption(value.value)
      controller.closeDropdown(false)
    }

    controller.focusSearch()
  })

  useEventListener(elementRef, 'mouseenter', () => {
    if (toValue(config?.disabled) || controller.isNavigatingWithKeyboard) {
      return
    }

    controller.moveToOption(value.value)
  })

  return {
    elementRef,
    isSelected,
    isActive,
  }
}
