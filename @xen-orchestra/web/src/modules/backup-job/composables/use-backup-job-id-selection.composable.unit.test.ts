import { useBackupJobIdSelection } from '@/modules/backup-job/composables/use-backup-job-id-selection.composable.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'

const ITEMS = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]

const FILTERED_ITEMS = ITEMS.slice(0, 3)

const PAGE_ITEMS = ITEMS.slice(0, 2)

function mountIdSelection(initialIds: string[] = []) {
  const selectedIds = ref(initialIds)

  const result = mountComposable(() => useBackupJobIdSelection(selectedIds, ITEMS, FILTERED_ITEMS, PAGE_ITEMS)).wrapper
    .vm

  return { result, selectedIds }
}

describe('isSelected', () => {
  it('tells whether an id is selected', () => {
    const { result } = mountIdSelection(['b'])

    expect({ a: result.isSelected('a'), b: result.isSelected('b') }).toEqual({ a: false, b: true })
  })
})

describe('toggleSelection', () => {
  it('selects an id', () => {
    const { result, selectedIds } = mountIdSelection(['b'])

    result.toggleSelection('d')

    expect(selectedIds.value).toEqual(['b', 'd'])
  })

  it('unselects an id', () => {
    const { result, selectedIds } = mountIdSelection(['b', 'd'])

    result.toggleSelection('b')

    expect(selectedIds.value).toEqual(['d'])
  })
})

describe('pageSelectionModel', () => {
  it.each([
    ['checked when the whole page is selected', ['a', 'b'], true],
    ['indeterminate when part of the page is selected', ['a', 'd'], undefined],
    ['unchecked when nothing on the page is selected', ['d'], false],
  ])('is %s', (_, initialIds, expected) => {
    expect(mountIdSelection(initialIds).result.pageSelectionModel).toBe(expected)
  })

  it('selects the whole page, keeping the selection of the other pages', () => {
    const { result, selectedIds } = mountIdSelection(['a', 'd'])

    result.pageSelectionModel = true

    expect(selectedIds.value).toEqual(['a', 'd', 'b'])
  })

  it('unselects the page, keeping the selection of the other pages', () => {
    const { result, selectedIds } = mountIdSelection(['a', 'b', 'd'])

    result.pageSelectionModel = false

    expect(selectedIds.value).toEqual(['d'])
  })
})

describe('selectionBindings', () => {
  it('counts the selected items, including those of the other pages', () => {
    const { result } = mountIdSelection(['a', 'c', 'd'])

    expect(result.selectionBindings).toMatchObject({
      selectedCount: 3,
      hiddenSelectedCount: 2,
      filteredCount: 3,
      areAllPageItemsSelected: false,
      areAllFilteredItemsSelected: false,
      areAllItemsSelected: false,
    })
  })

  it('tells when every filtered item is selected', () => {
    const { result } = mountIdSelection(['a', 'b', 'c'])

    expect(result.selectionBindings).toMatchObject({
      areAllPageItemsSelected: true,
      areAllFilteredItemsSelected: true,
      areAllItemsSelected: false,
    })
  })

  it('selects every filtered item', () => {
    const { result, selectedIds } = mountIdSelection(['d'])

    result.selectionBindings.onSelectAll()

    expect(selectedIds.value).toEqual(['d', 'a', 'b', 'c'])
  })

  it('clears the selection', () => {
    const { result, selectedIds } = mountIdSelection(['a', 'd'])

    result.selectionBindings.onClearSelection()

    expect(selectedIds.value).toEqual([])
  })
})
