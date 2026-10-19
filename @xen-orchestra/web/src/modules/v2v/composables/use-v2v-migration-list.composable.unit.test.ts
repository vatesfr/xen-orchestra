import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useV2vMigrationList } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { getV2vMigrationListStorageKey } from '@/modules/v2v/utils/v2v-migration-list.util.ts'
import {
  createV2vDestinationDefaults,
  createV2vMigrationList,
  createV2vMigrationListVms,
} from '@/test/create-v2v-migration-list.ts'
import { writeLocalStorageFromAnotherTab } from '@/test/local-storage.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { readV2vMigrationListStorage, seedV2vMigrationList } from '@/test/v2v-migration-list-storage.ts'
import { nextTick, type Ref, ref } from 'vue'

const [FIRST_VM, SECOND_VM, THIRD_VM, FOURTH_VM] = createV2vMigrationListVms(4)

const STORED_LIST = createV2vMigrationList({ vms: [FIRST_VM, SECOND_VM] })

// Every write rebuilds the list without this field: finding it again proves nothing was written
const UNWRITTEN_LIST = { ...STORED_LIST, unknownField: true }

const { sourceId: SOURCE_ID, poolId: POOL_ID } = STORED_LIST

const OTHER_POOL_ID = 'pool-2' as FrontXoPool['id']

const NEW_DEFAULTS = createV2vDestinationDefaults({
  template: 'template-2' as V2vMigrationList['defaults']['template'],
})

const STORAGE_KEY = getV2vMigrationListStorageKey(STORED_LIST)

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

function readStorageAfter(storedList: V2vMigrationList, write: ListWrite, options?: MountOptions) {
  seedV2vMigrationList(storedList)
  write(mountMigrationList(options))

  return readV2vMigrationListStorage()
}

// A list is only written for a known source and pool, whichever function writes it
function itStoresNothingWithoutSourceOrPool(write: ListWrite) {
  it.each(WITHOUT_SOURCE_OR_POOL)('leaves the stored list untouched without a %s', (_, options) => {
    expect(readStorageAfter(STORED_LIST, write, options)).toEqual(STORED_LIST)
    expect(localStorage.length).toBe(1)
  })
}

// The VMs cannot invent the destination defaults a stored list holds
function itStoresNoVmWithoutList(write: ListWrite) {
  it('stores nothing when no list is stored', () => {
    write(mountMigrationList())

    expect(localStorage.length).toBe(0)
  })

  itStoresNothingWithoutSourceOrPool(write)
}

beforeEach(() => {
  localStorage.clear()
})

describe('list', () => {
  it('is the list stored for the source and the pool', () => {
    seedV2vMigrationList(STORED_LIST)

    expect(mountMigrationList().list).toEqual(STORED_LIST)
  })

  it('is undefined when no list is stored', () => {
    expect(mountMigrationList().list).toBeUndefined()
  })

  it.each([
    ['is no JSON', '{not json'],
    ['is no list', '{"version":2}'],
  ])('is undefined when the stored value %s', (_, storedValue) => {
    localStorage.setItem(STORAGE_KEY, storedValue)

    expect(mountMigrationList().list).toBeUndefined()
  })

  it.each(WITHOUT_SOURCE_OR_POOL)('is undefined without a %s', (_, options) => {
    seedV2vMigrationList(STORED_LIST)

    expect(mountMigrationList(options).list).toBeUndefined()
  })

  it('reads the list of the newly chosen pool', async () => {
    const otherList = createV2vMigrationList({ poolId: OTHER_POOL_ID })
    seedV2vMigrationList(STORED_LIST)
    seedV2vMigrationList(otherList)
    const poolId = ref<FrontXoPool['id'] | undefined>(POOL_ID)
    const result = mountMigrationList({ poolId })

    poolId.value = OTHER_POOL_ID
    await nextTick()

    expect(result.list).toEqual(otherList)
  })

  it('follows the changes made in another tab', async () => {
    const result = mountMigrationList()

    await writeLocalStorageFromAnotherTab(STORAGE_KEY, JSON.stringify(STORED_LIST))

    expect(result.list).toEqual(STORED_LIST)
  })
})

describe('saveDefaults', () => {
  it('stores a new list with the defaults and no VM', () => {
    mountMigrationList().saveDefaults(NEW_DEFAULTS)

    expect(readV2vMigrationListStorage()).toEqual(createV2vMigrationList({ defaults: NEW_DEFAULTS }))
  })

  it('keeps the VMs of the stored list', () => {
    const storedList = readStorageAfter(STORED_LIST, result => result.saveDefaults(NEW_DEFAULTS))

    expect(storedList).toEqual({ ...STORED_LIST, defaults: NEW_DEFAULTS })
  })

  itStoresNothingWithoutSourceOrPool(result => result.saveDefaults(NEW_DEFAULTS))

  it('keeps the list in memory when the storage cannot be written', () => {
    const consoleError = silenceConsoleError()
    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage is full')
    })
    onTestFinished(() => setItem.mockRestore())
    const result = mountMigrationList()

    result.saveDefaults(NEW_DEFAULTS)

    expect(result.list).toEqual(createV2vMigrationList({ defaults: NEW_DEFAULTS }))
    expect(consoleError).toHaveBeenCalled()
  })
})

describe('addVms', () => {
  it('persists the VMs', () => {
    const storedList = readStorageAfter(createV2vMigrationList(), result => result.addVms([FIRST_VM.id, SECOND_VM.id]))

    expect(storedList).toEqual(STORED_LIST)
  })

  it('keeps the existing VMs first', () => {
    const storedList = readStorageAfter(STORED_LIST, result => result.addVms([FOURTH_VM.id, THIRD_VM.id]))

    expect(storedList).toEqual(createV2vMigrationList({ vms: [FIRST_VM, SECOND_VM, FOURTH_VM, THIRD_VM] }))
  })

  it('skips an id already in the list', () => {
    const storedList = readStorageAfter(STORED_LIST, result => result.addVms([SECOND_VM.id, THIRD_VM.id]))

    expect(storedList).toEqual(createV2vMigrationList({ vms: [FIRST_VM, SECOND_VM, THIRD_VM] }))
  })

  it('skips an id duplicated in its argument', () => {
    const storedList = readStorageAfter(STORED_LIST, result => result.addVms([THIRD_VM.id, THIRD_VM.id]))

    expect(storedList).toEqual(createV2vMigrationList({ vms: [FIRST_VM, SECOND_VM, THIRD_VM] }))
  })

  it('leaves the storage untouched when given no VM', () => {
    expect(readStorageAfter(UNWRITTEN_LIST, result => result.addVms([]))).toEqual(UNWRITTEN_LIST)
  })

  itStoresNoVmWithoutList(result => result.addVms([THIRD_VM.id]))
})

describe('removeVm', () => {
  it('deletes the VM and keeps the others', () => {
    const storedList = readStorageAfter(STORED_LIST, result => result.removeVm(FIRST_VM.id))

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

    expect(storedList).toEqual(createV2vMigrationList({ defaults: NEW_DEFAULTS }))
  })

  itStoresNoVmWithoutList(result => result.clearVms())
})
