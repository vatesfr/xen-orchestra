import { ifElse } from '@core/utils/if-else.utils'
import { autoUpdate, flip, type MaybeElement, shift, size, useFloating } from '@floating-ui/vue'
import { clamp, onClickOutside, useEventListener, useFocusWithin, whenever } from '@vueuse/core'
import { logicOr } from '@vueuse/math'
import { computed, provide, reactive, ref, watch } from 'vue'
import { type FormOptionIndex, type FormSelect, IK_FORM_SELECT_CONTROLLER } from './types.ts'
import { useFormSelectKeyboardNavigation } from './use-form-select-keyboard-navigation.ts'

export function useFormSelectController(select: FormSelect) {
  const activeOption = computed(() => select.options.value.find(option => option.flags.active))

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
    isMultiple: select.isMultiple,
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
    whileElementsMounted: autoUpdate,
    middleware: [shift(), flip(), size()],
    placement: 'bottom-start',
    open: isOpen,
  })

  /* SEARCH */

  watch(select.searchTerm, () => stopKeyboardNavigation())

  const searchRef = ref<MaybeElement<HTMLElement> & { focus?: () => void }>()

  function focusSearch() {
    if (!searchRef.value?.focus) {
      return false
    }

    searchRef.value.focus()

    return true
  }

  whenever(isOpen, () => focusSearch(), { flush: 'post' })

  const currentIndex = computed(() => select.options.value.findIndex(option => option.flags.active))

  whenever(select.options, () => moveToOptionIndex('first'), { flush: 'post' })

  ifElse(isOpen, () => moveToOptionIndex('selected'), clear, { flush: 'post' })

  function openDropdown() {
    if (select.isDisabled.value) {
      return
    }

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
    select.searchTerm.value = ''
  }

  const boundaryIndexes = computed(() => {
    let firstIndex: number | undefined
    let lastIndex: number | undefined

    select.options.value.forEach((option, index) => {
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
        return currentIndex.value - 7 // TODO: Handle page size in a better way
      case 'next-page':
        return currentIndex.value + 7 // TODO: Handle page size in a better way
      case 'first':
        return 0
      case 'last':
        return select.options.value.length - 1
      case 'selected':
        return select.options.value.findIndex(option => option.flags.selected)
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

    const closestIndex = getClosestEnabledIndex(index)

    if (closestIndex === undefined) {
      activeOption.value?.toggleFlag('active', false)

      return
    }

    select.options.value[closestIndex]?.toggleFlag('active', true)
  }

  function getClosestEnabledIndex(expectedIndex: number) {
    let index = expectedIndex

    const direction = expectedIndex < currentIndex.value ? -1 : 1

    while (select.options.value[index]?.properties.disabled) {
      index += direction
    }

    if (index > (boundaryIndexes.value?.last ?? -1)) {
      return undefined
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
      isDisabled: select.isDisabled,
      isMultiple: select.isMultiple,
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
