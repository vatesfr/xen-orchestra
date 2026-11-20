import { useEventListener } from '@vueuse/core'
import { type MaybeRefOrGetter, toValue } from 'vue'

const FOCUSABLE_SELECTOR = 'a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])'

/**
 * Keyboard handling of the tag select dropdown, on top of the form-select one which keeps handling the search input
 * (arrow keys to move between options, Enter to toggle the active option).
 *
 * The listeners are set on the dropdown, so the keys handled here never reach the form-select listeners set on the
 * select root.
 */
export function useTagSelectKeyboard({
  target,
  itemSelector,
  onCancel,
  onFocusLost,
}: {
  target: MaybeRefOrGetter<HTMLElement | null | undefined>
  /**
   * Items (e.g. the options) are focused as a whole by Tab and the arrow keys, and toggled with Enter or Space.
   * The focusable elements inside them are skipped.
   */
  itemSelector: string
  onCancel: () => void
  /**
   * Called when the focused element is removed or disabled by a click, so the focus can be moved back into the dropdown
   */
  onFocusLost: () => void
}) {
  function isItem(element: EventTarget | null): element is HTMLElement {
    return element instanceof HTMLElement && element.matches(itemSelector)
  }

  function isInsideItem(element: HTMLElement) {
    return (element.parentElement?.closest(itemSelector) ?? null) !== null
  }

  function getFocusableElements(container: HTMLElement) {
    return Array.from(container.querySelectorAll<HTMLElement>(`${FOCUSABLE_SELECTOR}, ${itemSelector}`)).filter(
      element => !isInsideItem(element)
    )
  }

  function getItems(container: HTMLElement) {
    return Array.from(container.querySelectorAll<HTMLElement>(itemSelector))
  }

  function focusSibling(elements: HTMLElement[], backward: boolean) {
    if (elements.length === 0) {
      return
    }

    const currentIndex = elements.findIndex(element => element === document.activeElement)
    const lastIndex = elements.length - 1

    if (backward) {
      elements[currentIndex > 0 ? currentIndex - 1 : lastIndex].focus()
    } else {
      elements[currentIndex < lastIndex ? currentIndex + 1 : 0].focus()
    }
  }

  function toggleItem(item: HTMLElement) {
    item.click()

    // Selecting an option moves the focus back to the search input, the focus stays on the item instead
    item.focus()
  }

  function isFocusInside(container: HTMLElement) {
    const activeElement = document.activeElement

    return (
      activeElement instanceof HTMLElement && container.contains(activeElement) && !activeElement.matches(':disabled')
    )
  }

  useEventListener(
    () => toValue(target),
    'keydown',
    (event: KeyboardEvent) => {
      const container = toValue(target)

      if (container === null || container === undefined) {
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onCancel()
        return
      }

      // Tab cycles through the dropdown controls and items instead of closing it
      if (event.key === 'Tab') {
        event.preventDefault()
        event.stopPropagation()
        focusSibling(getFocusableElements(container), event.shiftKey)
        return
      }

      if (isItem(event.target)) {
        // The focused item is handled here, not the form-select active option
        event.stopPropagation()

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          toggleItem(event.target)
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          focusSibling(getItems(container), event.key === 'ArrowUp')
        }

        return
      }

      // Buttons keep their native keyboard behavior instead of driving the options list
      if (event.target instanceof HTMLButtonElement) {
        event.stopPropagation()
      }
    }
  )

  function checkFocus() {
    const container = toValue(target)

    if (container === null || container === undefined || isFocusInside(container)) {
      return
    }

    onFocusLost()
  }

  // Captured because some controls stop the click propagation (e.g. the tag remove button), and checked in a new task
  // so the DOM has been updated by the click handlers
  useEventListener(
    () => toValue(target),
    'click',
    () => setTimeout(checkFocus),
    { capture: true }
  )
}
