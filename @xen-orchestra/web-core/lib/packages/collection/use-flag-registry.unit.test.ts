import { nextTick, ref, type Ref, toValue, watch } from 'vue'
import { useFlagRegistry } from './use-flag-registry.ts'

function spyOnWrites(ids: Ref<string[]>) {
  const onWrite = vi.fn()

  watch(ids, onWrite, { flush: 'sync' })

  return onWrite
}

const IDS = ['vm-1', 'vm-2', 'vm-3']

function findFlaggedIds<TFlag extends string>(registry: { isFlagged(id: string, flag: TFlag): boolean }, flag: TFlag) {
  return IDS.filter(id => registry.isFlagged(id, flag))
}

describe('a flag not in the config', () => {
  it.each([
    { member: 'assertFlag', use: registry => registry.assertFlag('active') },
    { member: 'isFlagged', use: registry => registry.isFlagged('vm-1', 'active') },
    { member: 'toggleFlag', use: registry => registry.toggleFlag('vm-1', 'active') },
    { member: 'toggleFlags', use: registry => registry.toggleFlags(['vm-1'], 'active', true) },
    { member: 'clearFlag', use: registry => registry.clearFlag('active') },
    { member: 'isMultipleAllowed', use: registry => registry.isMultipleAllowed('active') },
  ] satisfies { member: string; use: (registry: ReturnType<typeof useFlagRegistry<string, string>>) => unknown }[])(
    'makes $member throw',
    ({ use }) => {
      const registry = useFlagRegistry<string, string>({ selected: true })

      expect(() => use(registry)).toThrow('Flag "active" is not defined.')
    }
  )
})

describe('isFlagDefined', () => {
  it.each([
    { label: 'is true for a flag of the config', flag: 'selected', expected: true },
    { label: 'is false for any other flag', flag: 'active', expected: false },
  ])('$label', ({ flag, expected }) => {
    expect(useFlagRegistry<string, string>({ selected: true }).isFlagDefined(flag)).toBe(expected)
  })
})

describe('assertFlag', () => {
  it('accepts a flag of the config', () => {
    const registry = useFlagRegistry<string, string>({ selected: true })

    expect(() => registry.assertFlag('selected')).not.toThrow()
  })
})

describe('isFlagged', () => {
  it('is false for an id that was never flagged', () => {
    expect(findFlaggedIds(useFlagRegistry({ selected: true }), 'selected')).toEqual([])
  })
})

describe('toggleFlag', () => {
  it.each([
    { label: 'flags an unflagged id', toggles: [['vm-1']], expected: ['vm-1'] },
    { label: 'unflags a flagged id', toggles: [['vm-1'], ['vm-1']], expected: [] },
    {
      label: 'keeps an id flagged when asked to flag it again',
      toggles: [
        ['vm-1', true],
        ['vm-1', true],
      ],
      expected: ['vm-1'],
    },
    { label: 'keeps an id unflagged when asked to unflag it', toggles: [['vm-1', false]], expected: [] },
    { label: 'keeps the other ids flagged', toggles: [['vm-1'], ['vm-2']], expected: ['vm-1', 'vm-2'] },
  ] satisfies { label: string; toggles: [string, boolean?][]; expected: string[] }[])(
    '$label',
    ({ toggles, expected }) => {
      const registry = useFlagRegistry({ selected: true })

      toggles.forEach(([id, value]) => registry.toggleFlag(id, 'selected', value))

      expect(findFlaggedIds(registry, 'selected')).toEqual(expected)
    }
  )

  it('leaves the other flags of the id untouched', () => {
    const registry = useFlagRegistry({ selected: true, active: true })

    registry.toggleFlag('vm-1', 'selected')

    expect(findFlaggedIds(registry, 'active')).toEqual([])
  })
})

describe('toggleFlags', () => {
  it('flags every given id', () => {
    const registry = useFlagRegistry({ selected: true })

    registry.toggleFlags(['vm-1', 'vm-2'], 'selected', true)

    expect(findFlaggedIds(registry, 'selected')).toEqual(['vm-1', 'vm-2'])
  })

  it('unflags the given ids only', () => {
    const registry = useFlagRegistry({ selected: true })

    registry.toggleFlags(IDS, 'selected', true)
    registry.toggleFlags(['vm-1', 'vm-2'], 'selected', false)

    expect(findFlaggedIds(registry, 'selected')).toEqual(['vm-3'])
  })
})

describe('clearFlag', () => {
  it('unflags every id', () => {
    const registry = useFlagRegistry({ selected: true })

    registry.toggleFlags(['vm-1', 'vm-2'], 'selected', true)
    registry.clearFlag('selected')

    expect(findFlaggedIds(registry, 'selected')).toEqual([])
  })

  it('leaves the other flags untouched', () => {
    const registry = useFlagRegistry({ selected: true, active: true })

    registry.toggleFlag('vm-1', 'active')
    registry.clearFlag('selected')

    expect(findFlaggedIds(registry, 'active')).toEqual(['vm-1'])
  })
})

describe('isMultipleAllowed', () => {
  it('is true by default', () => {
    const registry = useFlagRegistry({ selected: true, active: {} })

    expect(registry.isMultipleAllowed('selected')).toBe(true)
    expect(registry.isMultipleAllowed('active')).toBe(true)
  })

  it('is false when `multiple` is false', () => {
    const registry = useFlagRegistry({ active: { multiple: false } })

    expect(registry.isMultipleAllowed('active')).toBe(false)
  })

  it('follows a `multiple` ref', () => {
    const multiple = ref(true)
    const registry = useFlagRegistry({ selected: { multiple } })

    multiple.value = false

    expect(registry.isMultipleAllowed('selected')).toBe(false)
  })
})

describe('`multiple` option', () => {
  it.each([
    {
      label: 'replaces the flagged id with the one `toggleFlag` flags when false',
      flag: (registry: ReturnType<typeof useFlagRegistry<'active', string>>) => registry.toggleFlag('vm-2', 'active'),
      expected: ['vm-2'],
    },
    {
      label: 'keeps the last id `toggleFlags` flags only when false',
      flag: (registry: ReturnType<typeof useFlagRegistry<'active', string>>) =>
        registry.toggleFlags(['vm-2', 'vm-3'], 'active', true),
      expected: ['vm-3'],
    },
  ])('$label', ({ flag, expected }) => {
    const registry = useFlagRegistry<'active', string>({ active: { multiple: false } })

    registry.toggleFlag('vm-1', 'active')
    flag(registry)

    expect(findFlaggedIds(registry, 'active')).toEqual(expected)
  })

  it('clears the flag when the ref changes', async () => {
    const multiple = ref(true)
    const registry = useFlagRegistry({ selected: { multiple } })

    registry.toggleFlags(['vm-1', 'vm-2'], 'selected', true)
    multiple.value = false
    await nextTick()

    expect(findFlaggedIds(registry, 'selected')).toEqual([])
  })
})

describe('`ids` option', () => {
  it('flags the ids the ref holds when the registry is created', () => {
    const ids = ref(['vm-1'])
    const registry = useFlagRegistry({ selected: { ids } })

    expect(findFlaggedIds(registry, 'selected')).toEqual(['vm-1'])
  })

  it('follows the ids set on the ref from outside', () => {
    const ids = ref(['vm-1'])
    const registry = useFlagRegistry({ selected: { ids } })

    ids.value = ['vm-2']

    expect(findFlaggedIds(registry, 'selected')).toEqual(['vm-2'])
  })

  it('holds the flagged ids, in the order they were flagged', () => {
    const ids = ref<string[]>([])
    const registry = useFlagRegistry({ selected: { ids } })

    registry.toggleFlag('vm-2', 'selected')
    registry.toggleFlags(['vm-1', 'vm-2', 'vm-3'], 'selected', true)
    registry.toggleFlag('vm-1', 'selected')

    expect(toValue(ids)).toEqual(['vm-2', 'vm-3'])
  })

  it('is emptied by `clearFlag`', () => {
    const ids = ref(['vm-1', 'vm-2'])
    const registry = useFlagRegistry({ selected: { ids } })

    registry.clearFlag('selected')

    expect(toValue(ids)).toEqual([])
  })

  it('receives a new array instead of a mutation of the previous one', () => {
    const initialIds = ['vm-1']
    const ids = ref(initialIds)
    const registry = useFlagRegistry({ selected: { ids } })

    registry.toggleFlag('vm-2', 'selected')

    expect(initialIds).toEqual(['vm-1'])
    expect(toValue(ids)).toEqual(['vm-1', 'vm-2'])
  })

  it('is written once when several ids are toggled together', () => {
    const ids = ref<string[]>([])
    const registry = useFlagRegistry({ selected: { ids } })
    const onWrite = spyOnWrites(ids)

    registry.toggleFlags(['vm-1', 'vm-2', 'vm-3'], 'selected', true)

    expect(onWrite).toHaveBeenCalledTimes(1)
  })

  it('is not written when an operation changes nothing', () => {
    const ids = ref(['vm-1'])
    const registry = useFlagRegistry({ selected: { ids }, active: { ids: ref<string[]>([]) } })
    const onWrite = spyOnWrites(ids)

    registry.toggleFlag('vm-1', 'selected', true)
    registry.toggleFlag('vm-2', 'selected', false)
    registry.toggleFlags([], 'selected', false)
    registry.clearFlag('active')

    expect(onWrite).not.toHaveBeenCalled()
  })
})
