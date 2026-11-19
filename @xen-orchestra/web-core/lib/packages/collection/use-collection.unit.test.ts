import { type MaybeRefOrGetter, ref, type Ref, toValue, watch } from 'vue'
import { useCollection } from './use-collection.ts'

type User = { id: string; group: 'admin' | 'user' }

function createUsers(): User[] {
  return [
    { id: 'user-1', group: 'admin' },
    { id: 'user-2', group: 'admin' },
    { id: 'user-3', group: 'user' },
  ]
}

function useUserCollection(config: { users?: MaybeRefOrGetter<User[]>; selectedIds?: Ref<string[]> } = {}) {
  return useCollection(config.users ?? createUsers(), {
    flags: { selected: { ids: config.selectedIds }, active: { multiple: false } },
  })
}

function getItem<TItem extends { id: string }>(items: Ref<TItem[]>, id: string) {
  const item = toValue(items).find(candidate => candidate.id === id)

  if (item === undefined) {
    throw new Error(`Item "${id}" not found`)
  }

  return item
}

describe('items', () => {
  it('holds an item per source, with its id and its source', () => {
    const users = createUsers()
    const { items } = useCollection(users)

    expect(items.value.map(item => item.id)).toEqual(['user-1', 'user-2', 'user-3'])
    expect(items.value.map(item => item.source)).toEqual(users)
  })

  it('follows the sources', () => {
    const users = ref(createUsers())
    const { items } = useCollection(users)

    users.value = [{ id: 'user-4', group: 'user' }]

    expect(items.value.map(item => item.id)).toEqual(['user-4'])
  })

  it('uses the source itself as id when it is a string or a number', () => {
    const { items } = useCollection(['first', 2])

    expect(items.value.map(item => item.id)).toEqual(['first', 2])
  })

  it('reads the id from the property named by `itemId`', () => {
    const { items } = useCollection([{ uuid: 'user-1' }], { itemId: 'uuid' })

    expect(items.value.map(item => item.id)).toEqual(['user-1'])
  })

  it('reads the id returned by the `itemId` function', () => {
    const { items } = useCollection([{ name: 'alice' }], { itemId: user => `user-${user.name}` })

    expect(items.value.map(item => item.id)).toEqual(['user-alice'])
  })

  it('attaches the properties computed from each source', () => {
    const { items } = useCollection(createUsers(), {
      properties: (user, index) => ({ isAdmin: user.group === 'admin', position: index + 1 }),
    })

    expect(items.value.map(item => item.properties)).toEqual([
      { isAdmin: true, position: 1 },
      { isAdmin: true, position: 2 },
      { isAdmin: false, position: 3 },
    ])
  })
})

describe('count', () => {
  it('is the number of items', () => {
    const users = ref(createUsers())
    const { count } = useCollection(users)

    expect(count.value).toBe(3)

    users.value = []

    expect(count.value).toBe(0)
  })
})

describe('useSubset', () => {
  it('keeps the items matching the filter', () => {
    const { useSubset } = useCollection(createUsers())

    const admins = useSubset(item => item.source.group === 'admin')

    expect(admins.items.value.map(item => item.id)).toEqual(['user-1', 'user-2'])
    expect(admins.count.value).toBe(2)
  })

  it('can be narrowed by a subset of its own', () => {
    const { useSubset } = useCollection(createUsers())

    const admins = useSubset(item => item.source.group === 'admin')
    const lastAdmins = admins.useSubset(item => item.id !== 'user-1')

    expect(lastAdmins.items.value.map(item => item.id)).toEqual(['user-2'])
  })
})

describe.each([
  ['kept by the collection', () => undefined],
  ['held by an `ids` ref', () => ref<string[]>([])],
])('flags %s', (_label, createSelectedIds) => {
  function useSelectableUsers(users: MaybeRefOrGetter<User[]> = createUsers()) {
    return useUserCollection({ users, selectedIds: createSelectedIds() })
  }

  describe('item.flags', () => {
    it('is false for an item that was never flagged', () => {
      const { items } = useSelectableUsers()

      expect(getItem(items, 'user-1').flags.selected).toBe(false)
    })

    it('flags the item when set to true', () => {
      const { items } = useSelectableUsers()

      getItem(items, 'user-1').flags.selected = true

      expect(getItem(items, 'user-1').flags.selected).toBe(true)
      expect(getItem(items, 'user-2').flags.selected).toBe(false)
    })

    it('unflags the previous item of a flag whose `multiple` is false', () => {
      const { items } = useSelectableUsers()

      getItem(items, 'user-1').flags.active = true
      getItem(items, 'user-2').flags.active = true

      expect(getItem(items, 'user-1').flags.active).toBe(false)
      expect(getItem(items, 'user-2').flags.active).toBe(true)
    })
  })

  describe('item.toggleFlag', () => {
    it('toggles the flag of the item', () => {
      const { items } = useSelectableUsers()

      getItem(items, 'user-1').toggleFlag('selected')

      expect(getItem(items, 'user-1').flags.selected).toBe(true)

      getItem(items, 'user-1').toggleFlag('selected')

      expect(getItem(items, 'user-1').flags.selected).toBe(false)
    })

    it('forces the flag to the given state', () => {
      const { items } = useSelectableUsers()

      getItem(items, 'user-1').toggleFlag('selected', true)
      getItem(items, 'user-1').toggleFlag('selected', true)

      expect(getItem(items, 'user-1').flags.selected).toBe(true)
    })
  })

  describe('toggleFlag', () => {
    it('toggles the flag of the item with the given id', () => {
      const { items, toggleFlag } = useSelectableUsers()

      toggleFlag('user-2', 'selected')

      expect(getItem(items, 'user-2').flags.selected).toBe(true)
    })
  })

  describe('useFlag', () => {
    it('lists the flagged items, their ids and their count, in the order of the collection', () => {
      const { useFlag } = useSelectableUsers()
      const selection = useFlag('selected')

      selection.toggle('user-3')
      selection.toggle('user-1')

      expect(selection.items.value.map(item => item.source.id)).toEqual(['user-1', 'user-3'])
      expect(selection.ids.value).toEqual(['user-1', 'user-3'])
      expect(selection.count.value).toBe(2)
    })

    it('tells the flagged items from the others with `isOn`', () => {
      const { useFlag } = useSelectableUsers()
      const selection = useFlag('selected')

      selection.toggle('user-1')

      expect(selection.isOn('user-1')).toBe(true)
      expect(selection.isOn('user-2')).toBe(false)
    })

    it('unflags a flagged item with `toggle`', () => {
      const { useFlag } = useSelectableUsers()
      const selection = useFlag('selected')

      selection.toggle('user-1')
      selection.toggle('user-1')

      expect(selection.isOn('user-1')).toBe(false)
    })

    it('tells whether none, some or all the items are flagged', () => {
      const { useFlag } = useSelectableUsers()
      const selection = useFlag('selected')

      expect([selection.areNoneOn.value, selection.areSomeOn.value, selection.areAllOn.value]).toEqual([
        true,
        false,
        false,
      ])

      selection.toggle('user-1')

      expect([selection.areNoneOn.value, selection.areSomeOn.value, selection.areAllOn.value]).toEqual([
        false,
        true,
        false,
      ])

      selection.toggle('user-2')
      selection.toggle('user-3')

      expect([selection.areNoneOn.value, selection.areSomeOn.value, selection.areAllOn.value]).toEqual([
        false,
        true,
        true,
      ])
    })

    it('never has `areAllOn` true on an empty collection', () => {
      const { useFlag } = useSelectableUsers([])

      expect(useFlag('selected').areAllOn.value).toBe(false)
    })

    it('flags every item with `toggleAll` unless they all are', () => {
      const { useFlag } = useSelectableUsers()
      const selection = useFlag('selected')

      selection.toggle('user-1')
      selection.toggleAll()

      expect(selection.ids.value).toEqual(['user-1', 'user-2', 'user-3'])
    })

    it('unflags every item with `toggleAll` when they all are flagged', () => {
      const { useFlag } = useSelectableUsers()
      const selection = useFlag('selected')

      selection.toggleAll()
      selection.toggleAll()

      expect(selection.ids.value).toEqual([])
    })

    it('forces every item to the state given to `toggleAll`', () => {
      const { useFlag } = useSelectableUsers()
      const selection = useFlag('selected')

      selection.toggle('user-1')
      selection.toggleAll(false)

      expect(selection.ids.value).toEqual([])

      selection.toggleAll(true)
      selection.toggleAll(true)

      expect(selection.ids.value).toEqual(['user-1', 'user-2', 'user-3'])
    })

    it('limits `toggleAll` to the items of the subset it comes from', () => {
      const { useFlag, useSubset } = useSelectableUsers()
      const selection = useFlag('selected')
      const adminSelection = useSubset(item => item.source.group === 'admin').useFlag('selected')

      adminSelection.toggleAll(true)

      expect(selection.ids.value).toEqual(['user-1', 'user-2'])

      selection.toggle('user-3')
      adminSelection.toggleAll(false)

      expect(selection.ids.value).toEqual(['user-3'])
    })

    it('narrows the flagged items with `useSubset`', () => {
      const { useFlag } = useSelectableUsers()
      const selection = useFlag('selected')

      selection.toggleAll(true)

      const selectedAdmins = selection.useSubset(item => item.source.group === 'admin')

      expect(selectedAdmins.items.value.map(item => item.id)).toEqual(['user-1', 'user-2'])
    })
  })

  describe('clearFlag', () => {
    it('unflags every item', () => {
      const { clearFlag, useFlag } = useSelectableUsers()
      const selection = useFlag('selected')

      selection.toggleAll(true)
      clearFlag('selected')

      expect(selection.ids.value).toEqual([])
    })

    it('unflags the items that are no longer in the collection', () => {
      const users = ref(createUsers())
      const { clearFlag, useFlag } = useSelectableUsers(users)
      const selection = useFlag('selected')

      selection.toggle('user-1')
      users.value = []
      clearFlag('selected')
      users.value = createUsers()

      expect(selection.ids.value).toEqual([])
    })
  })
})

describe('`ids` flag option', () => {
  it('flags the items whose id the ref holds when the collection is created', () => {
    const { useFlag } = useUserCollection({ selectedIds: ref(['user-2']) })

    expect(useFlag('selected').ids.value).toEqual(['user-2'])
  })

  it('receives the ids of the flagged items', () => {
    const selectedIds = ref<string[]>([])
    const { items, useFlag } = useUserCollection({ selectedIds })

    useFlag('selected').toggle('user-2')
    getItem(items, 'user-1').flags.selected = true

    expect(toValue(selectedIds)).toEqual(['user-2', 'user-1'])
  })

  it('changes the flagged items when set from outside', () => {
    const selectedIds = ref(['user-1'])
    const { useFlag } = useUserCollection({ selectedIds })
    const selection = useFlag('selected')

    selectedIds.value = ['user-2', 'user-3']

    expect(selection.ids.value).toEqual(['user-2', 'user-3'])
  })

  it('keeps the ids matching no item, which the flag utilities ignore', () => {
    const selectedIds = ref(['user-9'])
    const { useFlag } = useUserCollection({ selectedIds })
    const selection = useFlag('selected')

    selection.toggle('user-1')

    expect(toValue(selectedIds)).toEqual(['user-9', 'user-1'])
    expect(selection.ids.value).toEqual(['user-1'])
    expect(selection.count.value).toBe(1)
  })

  it('flags an item added after its id was set', () => {
    const users = ref<User[]>([])
    const { useFlag } = useUserCollection({ users, selectedIds: ref(['user-2']) })
    const selection = useFlag('selected')

    users.value = createUsers()

    expect(selection.ids.value).toEqual(['user-2'])
  })

  it('keeps the ids out of the subset on a subset `toggleAll`', () => {
    const selectedIds = ref(['user-1', 'user-3', 'user-9'])
    const { useSubset } = useUserCollection({ selectedIds })

    useSubset(item => item.source.group === 'admin')
      .useFlag('selected')
      .toggleAll(false)

    expect(toValue(selectedIds)).toEqual(['user-3', 'user-9'])
  })

  it('is written once on `toggleAll`', () => {
    const selectedIds = ref<string[]>([])
    const onWrite = vi.fn()
    const { useFlag } = useUserCollection({ selectedIds })

    watch(selectedIds, onWrite, { flush: 'sync' })
    useFlag('selected').toggleAll(true)

    expect(onWrite).toHaveBeenCalledTimes(1)
  })

  it('is emptied by `clearFlag`, ids matching no item included', () => {
    const selectedIds = ref(['user-1', 'user-9'])
    const { clearFlag } = useUserCollection({ selectedIds })

    clearFlag('selected')

    expect(toValue(selectedIds)).toEqual([])
  })
})
