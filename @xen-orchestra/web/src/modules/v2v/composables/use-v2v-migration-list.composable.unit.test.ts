import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useV2vMigrationList } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { getV2vMigrationListStorageKey } from '@/modules/v2v/utils/v2v-migration-list.util.ts'
import { OTHER_POOL_ID } from '@/test/create-pool.ts'
import {
  createNewerV2vMigrationList,
  createV2vDestinationDefaults,
  createV2vMigrationList,
  createV2vMigrationListVms,
} from '@/test/create-v2v-migration-list.ts'
import { writeLocalStorageFromAnotherTab } from '@/test/local-storage.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { readV2vMigrationListStorage, seedV2vMigrationList } from '@/test/v2v-migration-list-storage.ts'
import { V2V_EMPTY_LIST, V2V_LIST_WITH_VMS } from '@/test/v2v-wizard-fixtures.ts'
import { nextTick, type Ref, ref } from 'vue'

const [FIRST_VM, SECOND_VM, THIRD_VM, FOURTH_VM] = createV2vMigrationListVms(4)

// Every write rebuilds the list without this field: finding it again proves nothing was written
const UNWRITTEN_LIST = { ...V2V_LIST_WITH_VMS, unknownField: true }

const { sourceId: SOURCE_ID, poolId: POOL_ID } = V2V_LIST_WITH_VMS

const NEW_DEFAULTS = createV2vDestinationDefaults({
  template: 'template-2' as V2vMigrationList['defaults']['template'],
})

const NEW_DEFAULTS_LIST = createV2vMigrationList({ defaults: NEW_DEFAULTS })

const STORAGE_KEY = getV2vMigrationListStorageKey(V2V_LIST_WITH_VMS)

const NEWER_LIST = createNewerV2vMigrationList()

const NO_JSON = '{not json'

const NO_LIST_OR_NO_JSON: [string, string | null][] = [
  ['no list is stored', null],
  ['the stored value is no JSON', NO_JSON],
]

function storeValue(value: string | null) {
  if (value !== null) {
    localStorage.setItem(STORAGE_KEY, value)
  }
}

type MountOptions = {
  sourceId?: Ref<string | undefined>
  poolId?: Ref<FrontXoPool['id'] | undefined>
}

function mountMigrationList({ sourceId = ref(SOURCE_ID), poolId = ref(POOL_ID) }: MountOptions = {}) {
  return mountComposable(() => useV2vMigrationList(sourceId, poolId)).wrapper.vm
}

const WITHOUT_SOURCE_OR_POOL: [string, MountOptions][] = [
  ['source', { sourceId: ref(undefined) }],
  ['pool', { poolId: ref(undefined) }],
]

type ListWrite = (result: ReturnType<typeof mountMigrationList>) => void

function readStorageAfter(
  storedList: Parameters<typeof seedV2vMigrationList>[0],
  write: ListWrite,
  options?: MountOptions
) {
  seedV2vMigrationList(storedList)
  write(mountMigrationList(options))

  return readV2vMigrationListStorage()
}

// A list is only written for a known source and pool, whichever function writes it
function itStoresNothingWithoutSourceOrPool(write: ListWrite) {
  it.each(WITHOUT_SOURCE_OR_POOL)('leaves the stored list untouched without a %s', (_, options) => {
    expect(readStorageAfter(V2V_LIST_WITH_VMS, write, options)).toEqual(V2V_LIST_WITH_VMS)
    expect(localStorage.length).toBe(1)
  })
}

// A tab left open on an older XO must not erase the VMs of a list it cannot read, whichever function writes it
function itKeepsListOfNewerVersion(write: ListWrite) {
  it('keeps a list stored by a newer version', () => {
    expect(readStorageAfter(NEWER_LIST, write)).toEqual(NEWER_LIST)
  })
}

// The VMs cannot invent the destination defaults a stored list holds
function itStoresNoVmWithoutList(write: ListWrite) {
  it('stores nothing when no list is stored', () => {
    write(mountMigrationList())

    expect(localStorage.length).toBe(0)
  })

  itStoresNothingWithoutSourceOrPool(write)
  itKeepsListOfNewerVersion(write)
}

describe('list', () => {
  it('is the list stored for the source and the pool', () => {
    seedV2vMigrationList(V2V_LIST_WITH_VMS)

    expect(mountMigrationList().list).toEqual(V2V_LIST_WITH_VMS)
  })

  it('is undefined when no list is stored', () => {
    expect(mountMigrationList().list).toBeUndefined()
  })

  it.each([
    ['is no JSON', NO_JSON],
    ['is no list', '{"version":2}'],
  ])('is undefined when the stored value %s', (_, storedValue) => {
    storeValue(storedValue)

    expect(mountMigrationList().list).toBeUndefined()
  })

  it.each(WITHOUT_SOURCE_OR_POOL)('is undefined without a %s', (_, options) => {
    seedV2vMigrationList(V2V_LIST_WITH_VMS)

    expect(mountMigrationList(options).list).toBeUndefined()
  })

  it('reads the list of the newly chosen pool', async () => {
    const otherList = createV2vMigrationList({ poolId: OTHER_POOL_ID })
    seedV2vMigrationList(V2V_LIST_WITH_VMS)
    seedV2vMigrationList(otherList)
    const poolId = ref<FrontXoPool['id'] | undefined>(POOL_ID)
    const result = mountMigrationList({ poolId })

    poolId.value = OTHER_POOL_ID
    await nextTick()

    expect(result.list).toEqual(otherList)
  })

  it('follows the changes made in another tab', async () => {
    const result = mountMigrationList()

    await writeLocalStorageFromAnotherTab(STORAGE_KEY, JSON.stringify(V2V_LIST_WITH_VMS))

    expect(result.list).toEqual(V2V_LIST_WITH_VMS)
  })
})

describe('isStoredByNewerVersion', () => {
  it('is true when a newer version stored the list', () => {
    seedV2vMigrationList(NEWER_LIST)

    expect(mountMigrationList().isStoredByNewerVersion).toBe(true)
  })

  it.each([...NO_LIST_OR_NO_JSON, ['a list of this version is stored', JSON.stringify(V2V_LIST_WITH_VMS)]])(
    'is false when %s',
    (_, storedValue) => {
      storeValue(storedValue)

      expect(mountMigrationList().isStoredByNewerVersion).toBe(false)
    }
  )
})

describe('vmCount', () => {
  it('counts the VMs of the stored list', () => {
    seedV2vMigrationList(V2V_LIST_WITH_VMS)

    expect(mountMigrationList().vmCount).toBe(2)
  })

  it('is zero when no list is stored', () => {
    expect(mountMigrationList().vmCount).toBe(0)
  })
})

describe('hasVms', () => {
  it('is true once the stored list holds VMs', () => {
    seedV2vMigrationList(V2V_LIST_WITH_VMS)

    expect(mountMigrationList().hasVms).toBe(true)
  })

  it.each([
    ['the stored list holds no VM', V2V_EMPTY_LIST],
    ['no list is stored', undefined],
  ])('is false when %s', (_, list) => {
    if (list !== undefined) {
      seedV2vMigrationList(list)
    }

    expect(mountMigrationList().hasVms).toBe(false)
  })
})

describe('saveDefaults', () => {
  it.each(NO_LIST_OR_NO_JSON)('stores a new list with the defaults and no VM when %s', (_, storedValue) => {
    storeValue(storedValue)

    mountMigrationList().saveDefaults(NEW_DEFAULTS)

    expect(readV2vMigrationListStorage()).toEqual(NEW_DEFAULTS_LIST)
  })

  it('keeps the VMs of the stored list', () => {
    const storedList = readStorageAfter(V2V_LIST_WITH_VMS, result => result.saveDefaults(NEW_DEFAULTS))

    expect(storedList).toEqual({ ...V2V_LIST_WITH_VMS, defaults: NEW_DEFAULTS })
  })

  itStoresNothingWithoutSourceOrPool(result => result.saveDefaults(NEW_DEFAULTS))

  itKeepsListOfNewerVersion(result => result.saveDefaults(NEW_DEFAULTS))

  it('keeps the list in memory when the storage cannot be written', () => {
    const consoleError = silenceConsoleError()
    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage is full')
    })
    onTestFinished(() => setItem.mockRestore())
    const result = mountMigrationList()

    result.saveDefaults(NEW_DEFAULTS)

    expect(result.list).toEqual(NEW_DEFAULTS_LIST)
    expect(consoleError).toHaveBeenCalled()
  })
})

describe('addVms', () => {
  it('persists the VMs', () => {
    const storedList = readStorageAfter(V2V_EMPTY_LIST, result => result.addVms([FIRST_VM.id, SECOND_VM.id]))

    expect(storedList).toEqual(V2V_LIST_WITH_VMS)
  })

  it('keeps the existing VMs first', () => {
    const storedList = readStorageAfter(V2V_LIST_WITH_VMS, result => result.addVms([FOURTH_VM.id, THIRD_VM.id]))

    expect(storedList).toEqual(createV2vMigrationList({ vms: [FIRST_VM, SECOND_VM, FOURTH_VM, THIRD_VM] }))
  })

  it.each([
    ['already in the list', [SECOND_VM.id, THIRD_VM.id]],
    ['duplicated in its argument', [THIRD_VM.id, THIRD_VM.id]],
  ])('skips an id %s', (_, vmIds) => {
    const storedList = readStorageAfter(V2V_LIST_WITH_VMS, result => result.addVms(vmIds))

    expect(storedList).toEqual(createV2vMigrationList({ vms: [FIRST_VM, SECOND_VM, THIRD_VM] }))
  })

  it('leaves the storage untouched when given no VM', () => {
    expect(readStorageAfter(UNWRITTEN_LIST, result => result.addVms([]))).toEqual(UNWRITTEN_LIST)
  })

  itStoresNoVmWithoutList(result => result.addVms([THIRD_VM.id]))
})

describe('removeVm', () => {
  it('deletes the VM and keeps the others', () => {
    const storedList = readStorageAfter(V2V_LIST_WITH_VMS, result => result.removeVm(FIRST_VM.id))

    expect(storedList).toEqual(createV2vMigrationList({ vms: [SECOND_VM] }))
  })

  it('leaves the storage untouched for an unknown VM', () => {
    expect(readStorageAfter(UNWRITTEN_LIST, result => result.removeVm(THIRD_VM.id))).toEqual(UNWRITTEN_LIST)
  })

  itStoresNoVmWithoutList(result => result.removeVm(FIRST_VM.id))
})

describe('clearVms', () => {
  it('empties the VMs and keeps the defaults', () => {
    const listWithNewDefaults = createV2vMigrationList({ defaults: NEW_DEFAULTS, vms: [FIRST_VM] })

    const storedList = readStorageAfter(listWithNewDefaults, result => result.clearVms())

    expect(storedList).toEqual(NEW_DEFAULTS_LIST)
  })

  itStoresNoVmWithoutList(result => result.clearVms())
})
