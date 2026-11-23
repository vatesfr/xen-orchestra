import { nextTick, ref, type Ref, toValue, watch } from 'vue'
import { useFlagRegistry } from './use-flag-registry.ts'

function spyOnWrites(ids: Ref<string[]>) {
  const onWrite = vi.fn()

  watch(ids, onWrite, { flush: 'sync' })

  return onWrite
}

describe('isFlagDefined', () => {
  it('is true for a flag of the config', () => {
    const registry = useFlagRegistry<string, string>({ selected: true })

    expect(registry.isFlagDefined('selected')).toBe(true)
  })

  it('is false for any other flag', () => {
    const registry = useFlagRegistry<string, string>({ selected: true })

    expect(registry.isFlagDefined('active')).toBe(false)
  })
})

describe('assertFlag', () => {
  it('accepts a flag of the config', () => {
    const registry = useFlagRegistry<string, string>({ selected: true })

    expect(() => registry.assertFlag('selected')).not.toThrow()
  })

  it('throws for any other flag', () => {
    const registry = useFlagRegistry<string, string>({ selected: true })

    expect(() => registry.assertFlag('active')).toThrow('Flag "active" is not defined.')
  })
})

describe('isFlagged', () => {
  it('is false for an id that was never flagged', () => {
    const registry = useFlagRegistry({ selected: true })

    expect(registry.isFlagged('vm-1', 'selected')).toBe(false)
  })

  it('throws for a flag that is not in the config', () => {
    const registry = useFlagRegistry<string, string>({ selected: true })

    expect(() => registry.isFlagged('vm-1', 'active')).toThrow('Flag "active" is not defined.')
  })
})

describe('toggleFlag', () => {
  it('flags an unflagged id', () => {
    const registry = useFlagRegistry({ selected: true })

    registry.toggleFlag('vm-1', 'selected')

    expect(registry.isFlagged('vm-1', 'selected')).toBe(true)
  })

  it('unflags a flagged id', () => {
    const registry = useFlagRegistry({ selected: true })

    registry.toggleFlag('vm-1', 'selected')
    registry.toggleFlag('vm-1', 'selected')

    expect(registry.isFlagged('vm-1', 'selected')).toBe(false)
  })

  it('keeps an id flagged when asked to flag it again', () => {
    const registry = useFlagRegistry({ selected: true })

    registry.toggleFlag('vm-1', 'selected', true)
    registry.toggleFlag('vm-1', 'selected', true)

    expect(registry.isFlagged('vm-1', 'selected')).toBe(true)
  })

  it('keeps an id unflagged when asked to unflag it', () => {
    const registry = useFlagRegistry({ selected: true })

    registry.toggleFlag('vm-1', 'selected', false)

    expect(registry.isFlagged('vm-1', 'selected')).toBe(false)
  })

  it('keeps the other ids flagged', () => {
    const registry = useFlagRegistry({ selected: true })

    registry.toggleFlag('vm-1', 'selected')
    registry.toggleFlag('vm-2', 'selected')

    expect(registry.isFlagged('vm-1', 'selected')).toBe(true)
    expect(registry.isFlagged('vm-2', 'selected')).toBe(true)
  })

  it('leaves the other flags of the id untouched', () => {
    const registry = useFlagRegistry({ selected: true, active: true })

    registry.toggleFlag('vm-1', 'selected')

    expect(registry.isFlagged('vm-1', 'active')).toBe(false)
  })

  it('replaces the flagged id when `multiple` is false', () => {
    const registry = useFlagRegistry({ active: { multiple: false } })

    registry.toggleFlag('vm-1', 'active')
    registry.toggleFlag('vm-2', 'active')

    expect(registry.isFlagged('vm-1', 'active')).toBe(false)
    expect(registry.isFlagged('vm-2', 'active')).toBe(true)
  })

  it('throws for a flag that is not in the config', () => {
    const registry = useFlagRegistry<string, string>({ selected: true })

    expect(() => registry.toggleFlag('vm-1', 'active')).toThrow('Flag "active" is not defined.')
  })
})

describe('toggleFlags', () => {
  it('flags every given id', () => {
    const registry = useFlagRegistry({ selected: true })

    registry.toggleFlags(['vm-1', 'vm-2'], 'selected', true)

    expect(registry.isFlagged('vm-1', 'selected')).toBe(true)
    expect(registry.isFlagged('vm-2', 'selected')).toBe(true)
  })

  it('unflags the given ids only', () => {
    const registry = useFlagRegistry({ selected: true })

    registry.toggleFlags(['vm-1', 'vm-2', 'vm-3'], 'selected', true)
    registry.toggleFlags(['vm-1', 'vm-2'], 'selected', false)

    expect(registry.isFlagged('vm-1', 'selected')).toBe(false)
    expect(registry.isFlagged('vm-2', 'selected')).toBe(false)
    expect(registry.isFlagged('vm-3', 'selected')).toBe(true)
  })

  it('keeps the last given id only when `multiple` is false', () => {
    const registry = useFlagRegistry({ active: { multiple: false } })

    registry.toggleFlag('vm-1', 'active')
    registry.toggleFlags(['vm-2', 'vm-3'], 'active', true)

    expect(registry.isFlagged('vm-1', 'active')).toBe(false)
    expect(registry.isFlagged('vm-2', 'active')).toBe(false)
    expect(registry.isFlagged('vm-3', 'active')).toBe(true)
  })

  it('throws for a flag that is not in the config', () => {
    const registry = useFlagRegistry<string, string>({ selected: true })

    expect(() => registry.toggleFlags(['vm-1'], 'active', true)).toThrow('Flag "active" is not defined.')
  })
})

describe('clearFlag', () => {
  it('unflags every id', () => {
    const registry = useFlagRegistry({ selected: true })

    registry.toggleFlags(['vm-1', 'vm-2'], 'selected', true)
    registry.clearFlag('selected')

    expect(registry.isFlagged('vm-1', 'selected')).toBe(false)
    expect(registry.isFlagged('vm-2', 'selected')).toBe(false)
  })

  it('leaves the other flags untouched', () => {
    const registry = useFlagRegistry({ selected: true, active: true })

    registry.toggleFlag('vm-1', 'active')
    registry.clearFlag('selected')

    expect(registry.isFlagged('vm-1', 'active')).toBe(true)
  })

  it('throws for a flag that is not in the config', () => {
    const registry = useFlagRegistry<string, string>({ selected: true })

    expect(() => registry.clearFlag('active')).toThrow('Flag "active" is not defined.')
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

  it('throws for a flag that is not in the config', () => {
    const registry = useFlagRegistry<string, string>({ selected: true })

    expect(() => registry.isMultipleAllowed('active')).toThrow('Flag "active" is not defined.')
  })
})

describe('`multiple` option', () => {
  it('clears the flag when the ref changes', async () => {
    const multiple = ref(true)
    const registry = useFlagRegistry({ selected: { multiple } })

    registry.toggleFlags(['vm-1', 'vm-2'], 'selected', true)
    multiple.value = false
    await nextTick()

    expect(registry.isFlagged('vm-1', 'selected')).toBe(false)
    expect(registry.isFlagged('vm-2', 'selected')).toBe(false)
  })
})

describe('`ids` option', () => {
  it('flags the ids the ref holds when the registry is created', () => {
    const ids = ref(['vm-1'])
    const registry = useFlagRegistry({ selected: { ids } })

    expect(registry.isFlagged('vm-1', 'selected')).toBe(true)
    expect(registry.isFlagged('vm-2', 'selected')).toBe(false)
  })

  it('follows the ids set on the ref from outside', () => {
    const ids = ref(['vm-1'])
    const registry = useFlagRegistry({ selected: { ids } })

    ids.value = ['vm-2']

    expect(registry.isFlagged('vm-1', 'selected')).toBe(false)
    expect(registry.isFlagged('vm-2', 'selected')).toBe(true)
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
