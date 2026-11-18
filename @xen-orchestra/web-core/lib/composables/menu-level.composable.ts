import { type MaybeRefOrGetter, onScopeDispose, readonly, ref, shallowRef, toValue } from 'vue'

const OPEN_DELAY = 150

const CLOSE_DELAY = 300

const SAFE_AREA_TIMEOUT = 300

const SAFE_AREA_BLEED = 4

type Point = { x: number; y: number }

type Triangle = [Point, Point, Point]

export type MenuLevelHover = {
  itemId: string
  hasSubmenu: boolean
}

export type MenuLevel = ReturnType<typeof useMenuLevel>

function cross(origin: Point, a: Point, b: Point) {
  return (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x)
}

function isPointInTriangle(point: Point, [a, b, c]: Triangle) {
  const signs = [cross(point, a, b), cross(point, b, c), cross(point, c, a)]

  return !(signs.some(sign => sign < 0) && signs.some(sign => sign > 0))
}

function getSafeArea(exit: Point, submenu: HTMLElement): Triangle | undefined {
  const { top, right, bottom, left } = submenu.getBoundingClientRect()

  switch (submenu.dataset.placement?.split('-')[0]) {
    case 'right':
      return [
        { x: exit.x - SAFE_AREA_BLEED, y: exit.y },
        { x: left, y: top },
        { x: left, y: bottom },
      ]
    case 'left':
      return [
        { x: exit.x + SAFE_AREA_BLEED, y: exit.y },
        { x: right, y: top },
        { x: right, y: bottom },
      ]
    case 'bottom':
      return [
        { x: exit.x, y: exit.y - SAFE_AREA_BLEED },
        { x: left, y: top },
        { x: right, y: top },
      ]
    case 'top':
      return [
        { x: exit.x, y: exit.y + SAFE_AREA_BLEED },
        { x: left, y: bottom },
        { x: right, y: bottom },
      ]
    default:
      return undefined
  }
}

export function useMenuLevel({ isPopup, horizontal }: { isPopup: boolean; horizontal: MaybeRefOrGetter<boolean> }) {
  const openedItemId = ref<string>()

  const submenuElement = shallowRef<HTMLElement>()

  let pendingTimeout: ReturnType<typeof setTimeout> | undefined

  let pendingItemId: string | undefined

  let safeArea: Triangle | undefined

  let safeAreaTimeout: ReturnType<typeof setTimeout> | undefined

  let hoveredItem: MenuLevelHover | undefined

  function cancelPending() {
    clearTimeout(pendingTimeout)
    pendingTimeout = undefined
    pendingItemId = undefined
  }

  function clearSafeArea() {
    clearTimeout(safeAreaTimeout)
    safeAreaTimeout = undefined
    safeArea = undefined
  }

  function setOpenedItem(itemId: string | undefined) {
    cancelPending()
    clearSafeArea()
    openedItemId.value = itemId
  }

  function schedule(itemId: string | undefined, delay: number) {
    if (pendingTimeout !== undefined && pendingItemId === itemId) {
      return
    }

    cancelPending()
    pendingItemId = itemId
    pendingTimeout = setTimeout(() => setOpenedItem(itemId), delay)
  }

  function evaluateHover({ itemId, hasSubmenu }: MenuLevelHover) {
    const targetItemId = hasSubmenu ? itemId : undefined

    if (targetItemId === openedItemId.value) {
      cancelPending()
      return
    }

    if (openedItemId.value !== undefined) {
      schedule(targetItemId, CLOSE_DELAY)
      return
    }

    if (isPopup || !toValue(horizontal)) {
      schedule(targetItemId, OPEN_DELAY)
    }
  }

  function startSafeAreaTimeout() {
    clearTimeout(safeAreaTimeout)

    safeAreaTimeout = setTimeout(() => {
      clearSafeArea()

      if (hoveredItem !== undefined) {
        evaluateHover(hoveredItem)
      }
    }, SAFE_AREA_TIMEOUT)
  }

  function hoverItem(hover: MenuLevelHover, event: PointerEvent) {
    hoveredItem = hover

    if (safeArea !== undefined && isPointInTriangle({ x: event.clientX, y: event.clientY }, safeArea)) {
      startSafeAreaTimeout()
      return
    }

    clearSafeArea()
    evaluateHover(hover)
  }

  function leaveItem(itemId: string, event: PointerEvent) {
    hoveredItem = undefined
    cancelPending()

    if (openedItemId.value !== itemId || submenuElement.value === undefined) {
      return
    }

    safeArea = getSafeArea({ x: event.clientX, y: event.clientY }, submenuElement.value)
    startSafeAreaTimeout()
  }

  function enterSubmenu() {
    cancelPending()
    clearSafeArea()
  }

  function registerSubmenu(element: HTMLElement) {
    submenuElement.value = element

    return () => {
      if (submenuElement.value === element) {
        submenuElement.value = undefined
      }
    }
  }

  function closeItem(itemId: string) {
    if (openedItemId.value === itemId) {
      setOpenedItem(undefined)
    }
  }

  onScopeDispose(() => {
    cancelPending()
    clearSafeArea()
  })

  return {
    isPopup,
    openedItemId: readonly(openedItemId),
    openItem: (itemId: string) => setOpenedItem(itemId),
    closeItem,
    close: () => setOpenedItem(undefined),
    hoverItem,
    leaveItem,
    enterSubmenu,
    registerSubmenu,
  }
}
