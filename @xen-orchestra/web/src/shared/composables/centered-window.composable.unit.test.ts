import { useCenteredWindow } from '@/shared/composables/centered-window.composable.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'

const VISIBLE_COUNT = 5

function createItems(count: number) {
  return Array.from({ length: count }, (_, index) => `item-${index}`)
}

function mountCenteredWindow(itemsCount: number, currentIndex: number) {
  return mountComposable(() => useCenteredWindow(createItems(itemsCount), currentIndex, VISIBLE_COUNT)).wrapper.vm
}

describe('hasHiddenItems', () => {
  it('is false when every item fits in the window', () => {
    expect(mountCenteredWindow(VISIBLE_COUNT, 0).hasHiddenItems).toBe(false)
  })

  it('is true when there are more items than the window holds', () => {
    expect(mountCenteredWindow(VISIBLE_COUNT + 1, 0).hasHiddenItems).toBe(true)
  })
})

describe('visibleItems', () => {
  it('returns every item when they all fit in the window', () => {
    expect(mountCenteredWindow(3, 1).visibleItems).toEqual(createItems(3))
  })

  it('centers the window on the current item', () => {
    expect(mountCenteredWindow(10, 5).visibleItems).toEqual(['item-3', 'item-4', 'item-5', 'item-6', 'item-7'])
  })

  it('keeps the window at the start when the current item is among the first ones', () => {
    expect(mountCenteredWindow(10, 1).visibleItems).toEqual(createItems(VISIBLE_COUNT))
  })

  it('keeps the window at the end when the current item is among the last ones', () => {
    expect(mountCenteredWindow(10, 9).visibleItems).toEqual(['item-5', 'item-6', 'item-7', 'item-8', 'item-9'])
  })

  it('keeps the window at the start when the current item is not in the list', () => {
    expect(mountCenteredWindow(10, -1).visibleItems).toEqual(createItems(VISIBLE_COUNT))
  })

  it('returns every item once expanded', () => {
    const result = mountCenteredWindow(10, 5)

    result.isExpanded = true

    expect(result.visibleItems).toEqual(createItems(10))
  })

  it('follows the current item when it changes', () => {
    const currentIndex = ref(0)
    const result = mountComposable(() => useCenteredWindow(createItems(10), currentIndex, VISIBLE_COUNT)).wrapper.vm

    expect(result.visibleItems).toEqual(createItems(VISIBLE_COUNT))

    currentIndex.value = 9

    expect(result.visibleItems).toEqual(['item-5', 'item-6', 'item-7', 'item-8', 'item-9'])
  })
})
