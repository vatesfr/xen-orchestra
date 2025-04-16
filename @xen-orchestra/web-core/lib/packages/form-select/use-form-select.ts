import {
  type FormOption,
  type FormOptionIndex,
  IK_FORM_SELECT_CONTROLLER,
  useFormSelectKeyboardNavigation,
} from '@core/packages/form-select'
import { ifElse } from '@core/utils/if-else.utils'
import { type MaybeElement, useFloating } from '@floating-ui/vue'
import { clamp, onClickOutside, useEventListener, useFocusWithin, whenever } from '@vueuse/core'
import { logicOr } from '@vueuse/math'
import { computed, type MaybeRefOrGetter, provide, reactive, type Ref, ref, toValue, watch } from 'vue'

export function useFormSelect<TOption extends FormOption<unknown, PropertyKey>>(config: {
  options: MaybeRefOrGetter<TOption[]>
  searchTerm: Ref<string | undefined>
}) {
  const options = computed(() => toValue(config.options))

  const isMultiple = computed(() => options.value[0]?.properties.multiple ?? false)

  const activeOption = computed(() => options.value.find(option => option.flags.active))

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

  const { isNavigatingWithKeyboard, stopKeyboardNavigation } = useFormSelectKeyboardNavigation({
    isActive,
    isMultiple,
    isOpen,
    onSelect: () => activeOption.value?.toggleFlag('selected', true),
    onToggle: () => activeOption.value?.toggleFlag('selected'),
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

  watch(config.searchTerm, () => stopKeyboardNavigation())

  const searchRef = ref<MaybeElement<HTMLElement> & { focus?: () => void }>()

  function focusSearch() {
    if (!searchRef.value?.focus) {
      return false
    }

    searchRef.value?.focus?.()

    return true
  }

  whenever(isOpen, () => focusSearch(), { flush: 'post' })

  const currentIndex = computed(() => options.value.findIndex(option => option.flags.active))

  whenever(options, () => moveToOptionIndex('first'), { flush: 'post' })

  ifElse(isOpen, () => moveToOptionIndex('selected'), clear, { flush: 'post' })

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
    if (config.searchTerm.value !== undefined) {
      config.searchTerm.value = ''
    }
  }

  const boundaryIndexes = computed(() => {
    let firstIndex: number | undefined
    let lastIndex: number | undefined

    options.value.forEach((option, index) => {
      if (option.properties.disabled) {
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
        return options.value.length - 1
      case 'selected':
        return options.value.findIndex(option => option.flags.selected)
      default:
        return index
    }
  }

  function moveToOptionIndex(_index: FormOptionIndex) {
    if (boundaryIndexes.value === undefined) {
      activeOption.value?.toggleFlag('active', false)
      return
    }

    const index = clamp(parseIndex(_index), boundaryIndexes.value.first, boundaryIndexes.value.last)

    options.value[getClosestEnabledIndex(index)]?.toggleFlag('active', true)
  }

  function getClosestEnabledIndex(expectedIndex: number) {
    let index = expectedIndex

    const direction = expectedIndex < currentIndex.value ? -1 : 1

    while (options.value[index]?.properties.disabled) {
      index += direction
    }

    return index
  }

  function focusSearchOrTrigger() {
    if (!focusSearch()) {
      focusTrigger()
    }
  }

  provide(
    IK_FORM_SELECT_CONTROLLER,
    reactive({
      isNavigatingWithKeyboard,
      focusSearchOrTrigger,
      closeDropdown,
    })
  )

  return {
    triggerRef,
    dropdownRef,
    searchRef,
    openDropdown,
    closeDropdown,
    isOpen,
    floatingStyles,
  }
}
