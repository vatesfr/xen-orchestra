import { useEventListener } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

const MENU_SELECTOR = '.menu-list'

const ITEM_SELECTOR = '.menu-trigger'

const INTERACTIVE_SELECTOR = 'a[href], button'

type ItemPosition = 'first' | 'last' | 'previous' | 'next'

export function useMenuListNavigation({
  target,
  isHorizontal,
  canCloseWithArrowLeft,
  onClose,
  onLeave,
}: {
  target: MaybeRefOrGetter<HTMLElement | null | undefined>
  isHorizontal: MaybeRefOrGetter<boolean>
  canCloseWithArrowLeft: MaybeRefOrGetter<boolean>
  onClose: () => void
  onLeave: () => void
}) {
  const itemPositionByKey = computed<Partial<Record<string, ItemPosition>>>(() => ({
    [toValue(isHorizontal) ? 'ArrowLeft' : 'ArrowUp']: 'previous',
    [toValue(isHorizontal) ? 'ArrowRight' : 'ArrowDown']: 'next',
    Home: 'first',
    End: 'last',
  }))

  function getItems() {
    const menu = toValue(target)

    if (menu === null || menu === undefined) {
      return []
    }

    return Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(
      item => item.closest(MENU_SELECTOR) === menu
    )
  }

  function focusItem(position: ItemPosition) {
    const items = getItems()
    const currentIndex = items.findIndex(item => item.contains(document.activeElement))
    const lastIndex = items.length - 1

    const indexByPosition: Record<ItemPosition, number> = {
      first: 0,
      last: lastIndex,
      previous: currentIndex > 0 ? currentIndex - 1 : lastIndex,
      next: currentIndex < lastIndex ? currentIndex + 1 : 0,
    }

    items[indexByPosition[position]]?.focus()
  }

  function activateItem(item: HTMLElement) {
    const control = item.querySelector<HTMLElement>(INTERACTIVE_SELECTOR) ?? item

    control.click()
  }

  useEventListener(target, 'keydown', (event: KeyboardEvent) => {
    if (event.defaultPrevented) {
      return
    }

    const position = itemPositionByKey.value[event.key]

    if (position !== undefined) {
      event.preventDefault()
      focusItem(position)
      return
    }

    const item = getItems().find(item => item === event.target)

    if ((event.key === 'Enter' || event.key === ' ') && item !== undefined) {
      event.preventDefault()
      activateItem(item)
      return
    }

    if (event.key === 'Escape' || (event.key === 'ArrowLeft' && toValue(canCloseWithArrowLeft))) {
      event.preventDefault()
      onClose()
    } else if (event.key === 'Tab') {
      onLeave()
    }
  })

  return {
    focusFirstItem: () => focusItem('first'),
  }
}
