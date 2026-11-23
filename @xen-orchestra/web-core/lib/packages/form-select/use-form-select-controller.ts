import { ifElse } from '@core/utils/if-else.utils.ts'
import { autoUpdate, flip, type MaybeElement, type Placement, shift, size, useFloating } from '@floating-ui/vue'
import { clamp, onClickOutside, useEventListener, whenever } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, provide, reactive, ref, toValue, watch } from 'vue'
import { type FormOptionIndex, type FormSelect, IK_FORM_SELECT_CONTROLLER } from './types.ts'
import { useFormSelectKeyboardNavigation } from './use-form-select-keyboard-navigation.ts'

export type UseFormSelectControllerOptions = {
  fullscreen?: MaybeRefOrGetter<boolean>
  // Keeps the dropdown on the side of the trigger it opened on, for a dropdown whose height changes while open
  lockPlacement?: boolean
}

export function useFormSelectController(select: FormSelect, options: UseFormSelectControllerOptions = {}) {
  const rootRef = ref<HTMLElement>()

  const activeOption = computed(() => select.options.value.find(option => option.flags.active))

  const isOpen = ref(false)

  /* TRIGGER */

  const triggerRef = ref<HTMLElement>()

  useEventListener(triggerRef, 'click', () => openDropdown())

  function focusTrigger() {
    triggerRef.value?.focus?.()
  }

  /* KEYBOARD NAVIGATION */

  const { isNavigatingWithKeyboard, stopKeyboardNavigation } = useFormSelectKeyboardNavigation({
    target: rootRef,
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

  useEventListener(dropdownRef, 'mousedown', event => {
    if (event.target instanceof HTMLInputElement) {
      return
    }

    event.preventDefault()
  })

  /* DROPDOWN PLACEMENT */

  const lockedPlacement = ref<Placement>()

  const sizeMiddleware = size({
    apply: ({ availableHeight, availableWidth, elements }) => {
      const isFullscreen = toValue(options.fullscreen)
      elements.floating.style.maxWidth = isFullscreen ? '' : `${availableWidth}px`
      elements.floating.style.maxHeight = isFullscreen ? '' : `${Math.min(500, availableHeight)}px`
    },
  })

  const {
    floatingStyles: rawFloatingStyles,
    placement,
    isPositioned,
  } = useFloating(triggerRef, dropdownRef, {
    whileElementsMounted: autoUpdate,
    middleware: () => [shift(), ...(lockedPlacement.value === undefined ? [flip()] : []), sizeMiddleware],
    placement: () => lockedPlacement.value ?? 'bottom-start',
    open: isOpen,
    strategy: 'fixed',
  })

  // Flipping again as the height changes would make the dropdown jump to the other side of the trigger, and the
  // `max-height` set by `size` for that side would keep it there
  if (options.lockPlacement) {
    watch(isPositioned, positioned => {
      lockedPlacement.value = positioned ? placement.value : undefined
    })
  }

  const floatingStyles = computed(() => (toValue(options.fullscreen) ? undefined : rawFloatingStyles.value))

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

  whenever(isOpen, () => focusSearchOrTrigger(), { flush: 'post' })

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
      isOpen,
      focusSearchOrTrigger,
      closeDropdown,
    })
  )

  return {
    rootRef,
    triggerRef,
    dropdownRef,
    searchRef,
    openDropdown,
    closeDropdown,
    isOpen,
    floatingStyles,
  }
}
