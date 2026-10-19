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

const STORED_LIST = createV2vMigrationList({ vms: createV2vMigrationListVms(2) })

const { sourceId: SOURCE_ID, poolId: POOL_ID } = STORED_LIST

const OTHER_POOL_ID = 'pool-2' as FrontXoPool['id']

const NEW_DEFAULTS = createV2vDestinationDefaults({
  template: 'template-2' as V2vMigrationList['defaults']['template'],
})

const STORAGE_KEY = getV2vMigrationListStorageKey(STORED_LIST)

function mountMigrationList({
  sourceId = ref(SOURCE_ID),
  poolId = ref(POOL_ID),
}: {
  sourceId?: Ref<string | undefined>
  poolId?: Ref<FrontXoPool['id'] | undefined>
} = {}) {
  return mountComposable(() => useV2vMigrationList(sourceId, poolId)).wrapper.vm
}

const WITHOUT_SOURCE_OR_POOL: [string, Parameters<typeof mountMigrationList>[0]][] = [
  ['source', { sourceId: ref(undefined) }],
  ['pool', { poolId: ref(undefined) }],
]

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
  it('stores a new list with the defaults and no VM', async () => {
    mountMigrationList().saveDefaults(NEW_DEFAULTS)
    await nextTick()

    expect(readV2vMigrationListStorage()).toEqual(createV2vMigrationList({ defaults: NEW_DEFAULTS }))
  })

  it('keeps the VMs of the stored list', async () => {
    seedV2vMigrationList(STORED_LIST)

    mountMigrationList().saveDefaults(NEW_DEFAULTS)
    await nextTick()

    expect(readV2vMigrationListStorage()).toEqual({ ...STORED_LIST, defaults: NEW_DEFAULTS })
  })

  it.each(WITHOUT_SOURCE_OR_POOL)('stores nothing without a %s', async (_, options) => {
    mountMigrationList(options).saveDefaults(NEW_DEFAULTS)
    await nextTick()

    expect(localStorage.length).toBe(0)
  })

  it('keeps the list in memory when the storage cannot be written', async () => {
    const consoleError = silenceConsoleError()
    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage is full')
    })
    onTestFinished(() => setItem.mockRestore())
    const result = mountMigrationList()

    result.saveDefaults(NEW_DEFAULTS)
    await nextTick()

    expect(result.list).toEqual(createV2vMigrationList({ defaults: NEW_DEFAULTS }))
    expect(consoleError).toHaveBeenCalled()
  })
})
