import { useTableSelection } from '@core/composables/table-selection.composable.ts'
import { type MaybeRefOrGetter, ref, type Ref, toValue, watch } from 'vue'

type Vm = { id: string }

function createVms(...ids: string[]): Vm[] {
  return ids.map(id => ({ id }))
}

function useVmSelection(config: {
  items: MaybeRefOrGetter<Vm[]>
  filteredItems?: MaybeRefOrGetter<Vm[]>
  pageItems?: MaybeRefOrGetter<Vm[]>
  selectedIds?: Ref<string[]>
}) {
  const filteredItems = config.filteredItems ?? config.items

  return useTableSelection({
    items: config.items,
    filteredItems,
    pageItems: config.pageItems ?? filteredItems,
    getItemId: vm => vm.id,
    selectedIds: config.selectedIds,
  })
}

describe('selectedIds', () => {
  it('is empty by default', () => {
    const { selectedIds } = useVmSelection({ items: createVms('vm-1', 'vm-2') })

    expect(selectedIds.value).toEqual([])
  })

  it('includes the selected items hidden by the filter', () => {
    const { selectedIds, toggleSelection } = useVmSelection({
      items: createVms('vm-1', 'vm-2'),
      filteredItems: createVms('vm-1'),
    })

    toggleSelection('vm-1')
    toggleSelection('vm-2')

    expect(selectedIds.value).toEqual(['vm-1', 'vm-2'])
  })

  it('leaves out the items that are no longer in `items`', () => {
    const items = ref(createVms('vm-1', 'vm-2'))
    const { selectedIds, toggleSelection } = useVmSelection({ items })

    toggleSelection('vm-1')
    toggleSelection('vm-2')
    items.value = createVms('vm-2')

    expect(selectedIds.value).toEqual(['vm-2'])
  })
})

describe('selectedItems', () => {
  it('holds the selected items', () => {
    const [firstVm, secondVm] = createVms('vm-1', 'vm-2')
    const { selectedItems, toggleSelection } = useVmSelection({ items: [firstVm, secondVm] })

    toggleSelection('vm-2')

    expect(selectedItems.value).toEqual([secondVm])
  })
})

describe('isSelected', () => {
  it('tells the selected items from the others', () => {
    const { isSelected, toggleSelection } = useVmSelection({ items: createVms('vm-1', 'vm-2') })

    toggleSelection('vm-1')

    expect(isSelected('vm-1')).toBe(true)
    expect(isSelected('vm-2')).toBe(false)
  })
})

describe('toggleSelection', () => {
  it('unselects a selected item', () => {
    const { isSelected, toggleSelection } = useVmSelection({ items: createVms('vm-1') })

    toggleSelection('vm-1')
    toggleSelection('vm-1')

    expect(isSelected('vm-1')).toBe(false)
  })
})

describe('pageSelectionModel', () => {
  it('is false when no item of the page is selected', () => {
    const { pageSelectionModel, toggleSelection } = useVmSelection({
      items: createVms('vm-1', 'vm-2', 'vm-3'),
      pageItems: createVms('vm-1', 'vm-2'),
    })

    toggleSelection('vm-3')

    expect(pageSelectionModel.value).toBe(false)
  })

  it('is undefined when only some items of the page are selected', () => {
    const { pageSelectionModel, toggleSelection } = useVmSelection({
      items: createVms('vm-1', 'vm-2', 'vm-3'),
      pageItems: createVms('vm-1', 'vm-2'),
    })

    toggleSelection('vm-1')

    expect(pageSelectionModel.value).toBeUndefined()
  })

  it('is true when every item of the page is selected', () => {
    const { pageSelectionModel, toggleSelection } = useVmSelection({
      items: createVms('vm-1', 'vm-2', 'vm-3'),
      pageItems: createVms('vm-1', 'vm-2'),
    })

    toggleSelection('vm-1')
    toggleSelection('vm-2')

    expect(pageSelectionModel.value).toBe(true)
  })

  it('selects the items of the page only when set to true', () => {
    const { pageSelectionModel, selectedIds } = useVmSelection({
      items: createVms('vm-1', 'vm-2', 'vm-3'),
      pageItems: createVms('vm-1', 'vm-2'),
    })

    pageSelectionModel.value = true

    expect(selectedIds.value).toEqual(['vm-1', 'vm-2'])
  })

  it('unselects the items of the page only when set to false', () => {
    const { pageSelectionModel, selectedIds, toggleSelection } = useVmSelection({
      items: createVms('vm-1', 'vm-2', 'vm-3'),
      pageItems: createVms('vm-1', 'vm-2'),
    })

    toggleSelection('vm-1')
    toggleSelection('vm-3')
    pageSelectionModel.value = false

    expect(selectedIds.value).toEqual(['vm-3'])
  })
})

describe('selectionBindings', () => {
  it('counts the selected items, the ones out of the page and the filtered items', () => {
    const { selectionBindings, toggleSelection } = useVmSelection({
      items: createVms('vm-1', 'vm-2', 'vm-3', 'vm-4'),
      filteredItems: createVms('vm-1', 'vm-2', 'vm-3'),
      pageItems: createVms('vm-1', 'vm-2'),
    })

    toggleSelection('vm-1')
    toggleSelection('vm-3')
    toggleSelection('vm-4')

    expect(selectionBindings.value).toMatchObject({ selectedCount: 3, hiddenSelectedCount: 2, filteredCount: 3 })
  })

  it('tells whether the whole page, the whole filter and every item are selected', () => {
    const { selectionBindings, toggleSelection } = useVmSelection({
      items: createVms('vm-1', 'vm-2', 'vm-3'),
      filteredItems: createVms('vm-1', 'vm-2'),
      pageItems: createVms('vm-1'),
    })

    toggleSelection('vm-1')

    expect(selectionBindings.value).toMatchObject({
      areAllPageItemsSelected: true,
      areAllFilteredItemsSelected: false,
      areAllItemsSelected: false,
    })

    toggleSelection('vm-2')

    expect(selectionBindings.value).toMatchObject({
      areAllPageItemsSelected: true,
      areAllFilteredItemsSelected: true,
      areAllItemsSelected: false,
    })

    toggleSelection('vm-3')

    expect(selectionBindings.value).toMatchObject({
      areAllPageItemsSelected: true,
      areAllFilteredItemsSelected: true,
      areAllItemsSelected: true,
    })
  })

  it('selects every item matching the filter on `onSelectAll`', () => {
    const { selectionBindings, selectedIds } = useVmSelection({
      items: createVms('vm-1', 'vm-2', 'vm-3'),
      filteredItems: createVms('vm-1', 'vm-2'),
      pageItems: createVms('vm-1'),
    })

    selectionBindings.value.onSelectAll()

    expect(selectedIds.value).toEqual(['vm-1', 'vm-2'])
  })

  it('unselects every item, hidden by the filter or not, on `onClearSelection`', () => {
    const { selectionBindings, selectedIds, toggleSelection } = useVmSelection({
      items: createVms('vm-1', 'vm-2'),
      filteredItems: createVms('vm-1'),
    })

    toggleSelection('vm-1')
    toggleSelection('vm-2')
    selectionBindings.value.onClearSelection()

    expect(selectedIds.value).toEqual([])
  })
})

describe('`selectedIds` option', () => {
  it('starts with the items of the ref selected', () => {
    const { selectedIds } = useVmSelection({
      items: createVms('vm-1', 'vm-2'),
      selectedIds: ref(['vm-2']),
    })

    expect(selectedIds.value).toEqual(['vm-2'])
  })

  it('receives the selection', () => {
    const selectedVmIds = ref<string[]>([])
    const { toggleSelection } = useVmSelection({ items: createVms('vm-1', 'vm-2'), selectedIds: selectedVmIds })

    toggleSelection('vm-2')

    expect(toValue(selectedVmIds)).toEqual(['vm-2'])
  })

  it('changes the selection when set from outside', () => {
    const selectedVmIds = ref(['vm-1'])
    const { isSelected } = useVmSelection({ items: createVms('vm-1', 'vm-2'), selectedIds: selectedVmIds })

    selectedVmIds.value = ['vm-2']

    expect(isSelected('vm-1')).toBe(false)
    expect(isSelected('vm-2')).toBe(true)
  })

  it('keeps the ids matching no item, which the returned values ignore', () => {
    const selectedVmIds = ref(['vm-9'])
    const { selectedIds, selectionBindings, toggleSelection } = useVmSelection({
      items: createVms('vm-1'),
      selectedIds: selectedVmIds,
    })

    toggleSelection('vm-1')

    expect(toValue(selectedVmIds)).toEqual(['vm-9', 'vm-1'])
    expect(selectedIds.value).toEqual(['vm-1'])
    expect(selectionBindings.value.selectedCount).toBe(1)
  })

  it('selects an item loaded after its id was set', () => {
    const items = ref<Vm[]>([])
    const { selectedIds } = useVmSelection({ items, selectedIds: ref(['vm-1']) })

    items.value = createVms('vm-1', 'vm-2')

    expect(selectedIds.value).toEqual(['vm-1'])
  })

  it('is written once on `onSelectAll`', () => {
    const selectedVmIds = ref<string[]>([])
    const onWrite = vi.fn()
    const { selectionBindings } = useVmSelection({
      items: createVms('vm-1', 'vm-2', 'vm-3'),
      selectedIds: selectedVmIds,
    })

    watch(selectedVmIds, onWrite, { flush: 'sync' })
    selectionBindings.value.onSelectAll()

    expect(onWrite).toHaveBeenCalledTimes(1)
  })
})
