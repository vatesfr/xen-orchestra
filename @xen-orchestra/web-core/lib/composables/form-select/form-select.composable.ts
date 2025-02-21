import { createFocusScope } from '@core/composables/form-select/create-focus-scope'
import { createOpenScope } from '@core/composables/form-select/create-open-scope'
import { clamp, unrefElement, useEventListener, useFocusWithin, useToggle } from '@vueuse/core'
import { computed, type EffectScope, type MaybeRefOrGetter, ref, toValue, watch } from 'vue'

export interface UseFormSelectConfig<TItem> {
  identify: (item: TItem) => string | number
  multiple?: boolean
}

export function useFormSelect<TItem>(items: MaybeRefOrGetter<TItem[]>, config: UseFormSelectConfig<TItem>) {
  const selectedIds = ref(new Set<string | number>())

  const activeId = ref<string | number>()

  const options = computed(() =>
    toValue(items).map(item => {
      const id = config.identify(item)

      return {
        id,
        item,
        toggle: () => toggle(id),
        activate: () => activateId(id),
        selected: selectedIds.value.has(id),
        active: activeId.value === id,
      }
    })
  )

  const [isOpen, toggleOpen] = useToggle()

  watch(
    isOpen,
    isOpen => {
      activeId.value = isOpen ? options.value.find(option => option.selected)?.id : undefined
    },
    { flush: 'post' }
  )

  const inputRef = ref<HTMLElement>()

  const dropdownRef = ref<HTMLElement>()

  const { focused: isFocused } = useFocusWithin(inputRef)

  useEventListener(inputRef, 'click', () => toggleOpen())

  const selectedOptions = computed(() => options.value.filter(option => option.selected))

  function moveActive(direction: -1 | 1) {
    const currentIndex = options.value.findIndex(option => option.active)
    const nextIndex = clamp(currentIndex + direction, 0, options.value.length - 1)
    activeId.value = options.value[nextIndex]?.id
  }

  function activateId(id: string | number) {
    activeId.value = id
  }

  function toggleCurrent() {
    if (!activeId.value) {
      return
    }

    toggle(activeId.value)
  }

  function clear() {
    selectedIds.value.clear()
  }

  function focus() {
    unrefElement(inputRef.value)?.querySelector('input')?.focus()
  }

  function toggle(id: string | number) {
    if (!config.multiple) {
      clear()
      selectedIds.value.add(id)
      toggleOpen(false)
      focus()

      return
    }

    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id)
    } else {
      selectedIds.value.add(id)
    }
  }

  let scope: EffectScope | undefined

  watch([isFocused, isOpen], ([isFocused, isOpen]) => {
    scope?.stop()
    scope = undefined

    if (isOpen) {
      scope = createOpenScope({
        dropdownRef,
        inputRef,
        activatePrevious: () => moveActive(-1),
        activateNext: () => moveActive(1),
        toggleCurrent,
        close: () => toggleOpen(false),
      })
    } else if (isFocused) {
      scope = createFocusScope({
        open: () => toggleOpen(true),
      })
    }
  })

  return {
    activeId,
    inputRef,
    dropdownRef,
    selectedOptions,
    selectedIds,
    options,
    activateId,
    moveActive,
    toggleCurrent,
    toggle,
    isOpen,
    clear,
  }
}
