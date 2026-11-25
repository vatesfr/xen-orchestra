import { useMenuLevel } from '@core/composables/menu-level.composable.ts'
import { mountComposable } from '@core-test/mount-composable.ts'

type MountedLevel = ReturnType<typeof mountLevel>

function mountLevel({ isPopup = true, horizontal = false } = {}) {
  return mountComposable(() => useMenuLevel({ isPopup, horizontal })).wrapper.vm
}

function pointer(x = 0, y = 0) {
  return new PointerEvent('pointermove', { clientX: x, clientY: y })
}

function hover(level: MountedLevel, itemId: string, { hasSubmenu = true, x = 0, y = 0 } = {}) {
  level.hoverItem({ itemId, hasSubmenu }, pointer(x, y))
}

// Item `a` is open, and the pointer leaves it towards its submenu, on the right
function mountLevelLeavingTowardsSubmenu() {
  const level = mountLevel()
  const submenu = document.createElement('ul')

  submenu.dataset.placement = 'right-start'
  vi.spyOn(submenu, 'getBoundingClientRect').mockReturnValue(new DOMRect(200, 0, 100, 200))
  level.openItem('a')
  level.registerSubmenu(submenu)
  level.leaveItem('a', pointer(150, 40))

  return level
}

beforeEach(() => {
  vi.useFakeTimers()
})

describe('useMenuLevel', () => {
  it('opens the hovered submenu after 150 ms', () => {
    const level = mountLevel()

    hover(level, 'a')
    vi.advanceTimersByTime(149)

    expect(level.openedItemId).toBeUndefined()

    vi.advanceTimersByTime(1)

    expect(level.openedItemId).toBe('a')
  })

  it('does not restart the delay while the pointer keeps moving on the same item', () => {
    const level = mountLevel()

    hover(level, 'a')
    vi.advanceTimersByTime(100)
    hover(level, 'a', { x: 5 })
    vi.advanceTimersByTime(50)

    expect(level.openedItemId).toBe('a')
  })

  it('opens on hover in an inline vertical menu', () => {
    const level = mountLevel({ isPopup: false })

    hover(level, 'a')
    vi.advanceTimersByTime(150)

    expect(level.openedItemId).toBe('a')
  })

  it('needs a click to open a first submenu in an inline horizontal menu bar, then switches on hover', () => {
    const level = mountLevel({ isPopup: false, horizontal: true })

    hover(level, 'a')
    vi.advanceTimersByTime(1000)

    expect(level.openedItemId).toBeUndefined()

    level.openItem('a')
    hover(level, 'b')
    vi.advanceTimersByTime(300)

    expect(level.openedItemId).toBe('b')
  })

  it('closes the open submenu 300 ms after hovering an item without submenu', () => {
    const level = mountLevel()

    level.openItem('a')
    hover(level, 'c', { hasSubmenu: false })
    vi.advanceTimersByTime(299)

    expect(level.openedItemId).toBe('a')

    vi.advanceTimersByTime(1)

    expect(level.openedItemId).toBeUndefined()
  })

  it('switches to the hovered submenu when the open one closes, after 300 ms', () => {
    const level = mountLevel()

    level.openItem('a')
    hover(level, 'b')
    vi.advanceTimersByTime(299)

    expect(level.openedItemId).toBe('a')

    vi.advanceTimersByTime(1)

    expect(level.openedItemId).toBe('b')
  })

  it('cancels the pending change when the pointer leaves the item', () => {
    const level = mountLevel()

    level.openItem('a')
    hover(level, 'c', { hasSubmenu: false })
    level.leaveItem('c', pointer())
    hover(level, 'b')
    level.leaveItem('b', pointer())
    vi.advanceTimersByTime(1000)

    expect(level.openedItemId).toBe('a')
  })

  it('opens and closes right away on demand, cancelling the pending change', () => {
    const level = mountLevel()

    hover(level, 'b')
    level.openItem('a')
    vi.advanceTimersByTime(1000)

    expect(level.openedItemId).toBe('a')

    level.closeItem('b')

    expect(level.openedItemId).toBe('a')

    level.closeItem('a')

    expect(level.openedItemId).toBeUndefined()
  })

  it('ignores the sibling items crossed inside the safe area towards the open submenu', () => {
    const level = mountLevelLeavingTowardsSubmenu()

    hover(level, 'b', { x: 170, y: 60 })
    vi.advanceTimersByTime(200)
    hover(level, 'b', { x: 190, y: 70 })
    vi.advanceTimersByTime(200)
    level.leaveItem('b', pointer(195, 72))
    level.enterSubmenu()
    vi.advanceTimersByTime(1000)

    expect(level.openedItemId).toBe('a')
  })

  it('switches when a sibling item is hovered outside the safe area', () => {
    const level = mountLevelLeavingTowardsSubmenu()

    hover(level, 'b', { x: 150, y: 120 })
    vi.advanceTimersByTime(300)

    expect(level.openedItemId).toBe('b')
  })

  it('evaluates the hovered sibling item once the pointer rests in the safe area for 300 ms', () => {
    const level = mountLevelLeavingTowardsSubmenu()

    hover(level, 'b', { x: 170, y: 60 })
    vi.advanceTimersByTime(599)

    expect(level.openedItemId).toBe('a')

    vi.advanceTimersByTime(1)

    expect(level.openedItemId).toBe('b')
  })

  it('drops the pending changes when it is unmounted', () => {
    const { wrapper } = mountComposable(() => useMenuLevel({ isPopup: true, horizontal: false }))

    wrapper.vm.openItem('a')
    hover(wrapper.vm, 'c', { hasSubmenu: false })
    wrapper.unmount()
    vi.advanceTimersByTime(1000)

    expect(wrapper.vm.openedItemId).toBe('a')
  })
})
