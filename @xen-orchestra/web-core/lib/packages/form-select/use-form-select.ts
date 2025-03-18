import {
  type FormOption,
  type FormOptionIndex,
  type FormOptionValue,
  IK_FORM_SELECT_CONTROLLER,
} from '@core/packages/form-select/form-select.type'
import { useKeyboardNavigation } from '@core/packages/form-select/use-form-select-keyboard-navigation.ts'
import { ifElse } from '@core/utils/if-else.utils'
import { type MaybeElement, useFloating } from '@floating-ui/vue'
import {
  clamp,
  onClickOutside,
  refThrottled,
  useArrayMap,
  useEventListener,
  useFocusWithin,
  whenever,
} from '@vueuse/core'
import { logicOr } from '@vueuse/math'
import { computed, type MaybeRefOrGetter, type ModelRef, provide, reactive, ref, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export type UseFormSelectConfig = {
  multiple?: boolean
  showMax?: number
}

export function useFormSelect<TOption extends FormOption<unknown>>(
  model: ModelRef<FormOptionValue[]>,
  _options: MaybeRefOrGetter<TOption[]>,
  _config?: MaybeRefOrGetter<UseFormSelectConfig>
) {
  const { t } = useI18n()

  const config = computed<UseFormSelectConfig>(() => toValue(_config) ?? {})

  const isMultiple = computed(() => toValue(config.value.multiple ?? false))

  const rawOptions = computed(() => toValue(_options))

  const activeValue = ref<FormOptionValue>('')

  const isOpen = ref(false)

  /* TRIGGER */

  const triggerRef = ref<HTMLElement>()

  const { focused: isTriggerFocused } = useFocusWithin(triggerRef)

  const isActive = logicOr(isTriggerFocused, isOpen)

  useEventListener(triggerRef, 'click', () => openDropdown())

  function focusTrigger() {
    triggerRef.value?.focus?.()
  }

  /* KEYBOARD NAVIGATION */

  const { isNavigatingWithKeyboard, stopKeyboardNavigation } = useKeyboardNavigation({
    isActive,
    isMultiple,
    isOpen,
    onSelect: () => selectOption(activeValue.value),
    onToggle: () => toggleOption(activeValue.value),
    onOpen: openDropdown,
    onClose: closeDropdown,
    onMove: index => moveToOptionIndex(index),
  })

  /* DROPDOWN */

  const dropdownRef = ref<HTMLElement>()

  onClickOutside(dropdownRef, () => closeDropdown(true), { ignore: [triggerRef] })

  useEventListener(dropdownRef, 'mousemove', () => stopKeyboardNavigation())

  /* DROPDOWN PLACEMENT */

  const { floatingStyles } = useFloating(triggerRef, dropdownRef, {
    placement: 'bottom-start',
    open: isOpen,
  })

  /* SEARCH */

  const searchTerm = ref('')

  const throttledSearchTerm = refThrottled(searchTerm, 250)

  whenever(searchTerm, () => stopKeyboardNavigation())

  const searchRef = ref<MaybeElement<HTMLElement> & { focus?: () => void }>()

  function focusSearch() {
    searchRef.value?.focus?.()
  }

  whenever(isOpen, () => focusSearch(), { flush: 'post' })

  const filteredOptions = computed(() =>
    rawOptions.value.filter(option =>
      `${option.label} ${option.value}`.toLocaleLowerCase().includes(throttledSearchTerm.value.toLocaleLowerCase())
    )
  )

  const selectedOptions = computed(() => rawOptions.value.filter(option => model.value.includes(option.value)))

  const currentIndex = computed(() => filteredOptions.value.findIndex(option => option.value === activeValue.value))

  const selectedLabels = useArrayMap<TOption, string>(selectedOptions, option => String(option.label ?? option.value))

  const selectedLabel = computed(() => {
    const count = selectedLabels.value.length
    const max = config.value.showMax ?? 3

    return count > max
      ? t('core.select.n-selected-of', {
          count,
          total: rawOptions.value.length,
        })
      : selectedLabels.value.join(', ')
  })

  whenever(filteredOptions, () => moveToOptionIndex('first'), { flush: 'post' })

  ifElse(isOpen, () => moveToOptionIndex('selected'), clear, { flush: 'post' })

  function isOptionSelected(value: FormOptionValue) {
    return model.value.includes(value)
  }

  function openDropdown() {
    if (!isOpen.value) {
      isOpen.value = true
    }
  }

  function closeDropdown(keepFocus: boolean) {
    if (!isOpen.value) {
      return
    }

    isOpen.value = false

    if (keepFocus) {
      focusTrigger()
    }
  }

  function clear() {
    searchTerm.value = ''
    activeValue.value = ''
  }

  const boundaryIndexes = computed(() => {
    let firstIndex: number | undefined
    let lastIndex: number | undefined

    filteredOptions.value.forEach((option, index) => {
      if (option.disabled) {
        return
      }

      if (firstIndex === undefined) {
        firstIndex = index
      }

      lastIndex = index
    })

    if (firstIndex === undefined || lastIndex === undefined) {
      return undefined
    }

    return {
      first: firstIndex,
      last: lastIndex,
    }
  })

  function parseIndex(index: FormOptionIndex): number {
    switch (index) {
      case 'previous':
        return currentIndex.value - 1
      case 'next':
        return currentIndex.value + 1
      case 'previous-page':
        return currentIndex.value - 7 // TODO: Better handle page size.
      case 'next-page':
        return currentIndex.value + 7 // TODO: Better handle page size.
      case 'first':
        return 0
      case 'last':
        return filteredOptions.value.length - 1
      case 'selected':
        return filteredOptions.value.findIndex(option => model.value.includes(option.value))
      default:
        return index
    }
  }

  function moveToOptionIndex(_index: FormOptionIndex) {
    if (boundaryIndexes.value === undefined) {
      activeValue.value = ''
      return
    }

    const index = clamp(parseIndex(_index), boundaryIndexes.value.first, boundaryIndexes.value.last)

    activeValue.value = filteredOptions.value[getClosestEnabledIndex(index)]?.value ?? ''
  }

  function getClosestEnabledIndex(expectedIndex: number) {
    let index = expectedIndex

    const direction = expectedIndex < currentIndex.value ? -1 : 1

    while (filteredOptions.value[index]?.disabled) {
      index += direction
    }

    return index
  }

  function moveToOption(value: FormOptionValue) {
    activeValue.value = value
  }

  function selectOption(value: FormOptionValue) {
    if (!isMultiple.value) {
      model.value = [value]
    } else if (!isOptionSelected(value)) {
      model.value = [...model.value, value]
    }
  }

  function deselectOption(value: FormOptionValue) {
    if (!isOptionSelected(value)) {
      return
    }

    model.value = isMultiple.value ? model.value.filter(v => v !== value) : []
  }

  function toggleOption(value: FormOptionValue) {
    if (isOptionSelected(value)) {
      deselectOption(value)
    } else {
      selectOption(value)
    }
  }

  function isOptionActive(value: FormOptionValue) {
    return activeValue.value === value
  }

  provide(
    IK_FORM_SELECT_CONTROLLER,
    reactive({
      isNavigatingWithKeyboard,
      isMultiple,
      isOptionActive,
      isOptionSelected,
      selectOption,
      toggleOption,
      moveToOption,
      focusSearch,
      closeDropdown,
    })
  )

  return {
    triggerRef,
    dropdownRef,
    searchRef,
    searchTerm,
    activeValue,
    openDropdown,
    closeDropdown,
    filteredOptions,
    isOptionSelected,
    selectedLabel,
    isOpen,
    floatingStyles,
  }
}
