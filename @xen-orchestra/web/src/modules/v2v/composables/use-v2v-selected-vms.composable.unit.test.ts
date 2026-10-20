import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useV2vSelectedVms } from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import { useV2vVmsStep } from '@/modules/v2v/composables/use-v2v-vms-step.composable.ts'
import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createPool, DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { createV2vImportVm } from '@/test/create-v2v-import-vm.ts'
import { createV2vMigrationList } from '@/test/create-v2v-migration-list.ts'
import { getV2vVmIds } from '@/test/create-v2v-vm-row.ts'
import { deleteModalMock } from '@/test/mock-delete-modal.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { v2vVmRowsCollectionsMock } from '@/test/mock-xo-v2v-vm-rows-collections.ts'
import { mountV2vVmsStep } from '@/test/mount-v2v-vms-step.ts'
import { readV2vMigrationListStorage } from '@/test/v2v-migration-list-storage.ts'
import { V2V_DB_VM, V2V_LISTED_VM, V2V_RDM_VM, V2V_WEB_VM } from '@/test/v2v-vms-fixtures.ts'
import type { XoV2vVm } from '@vates/types'

vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'),
  () => import('@/test/mock-xo-v2v-vm-rows-collections.ts')
)
vi.mock(
  import('@/modules/task/remote-resources/use-xo-task-collection.ts'),
  () => import('@/test/mock-xo-v2v-vm-rows-collections.ts')
)
vi.mock(
  import('@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'),
  () => import('@/test/mock-xo-v2v-vm-rows-collections.ts')
)
vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(import('@core/composables/modals/use-delete-modal.ts'), () => import('@/test/mock-delete-modal.ts'))

const LIST = createV2vMigrationList({ vms: [{ id: V2V_WEB_VM.id }, { id: V2V_DB_VM.id }, { id: V2V_RDM_VM.id }] })

const EMPTY_LIST = createV2vMigrationList()

const LIST_IDS = getV2vVmIds(LIST.vms)

const POOL = createPool({ id: LIST.poolId, name_label: DISKOR_POOL_NAME })

const OTHER_POOL = createPool({ id: 'pool-other' as FrontXoPool['id'], name_label: 'pool other' })

const SR = createSr({ id: LIST.defaults.sr, name_label: 'sr-nvme-01' })

const NETWORK = createNetwork({ id: LIST.defaults.network, name_label: 'VLAN 10' })

const GONE_VM_ID = 'vm-gone' as XoV2vVm['id']

const WEB_LIST = createV2vMigrationList({ vms: [{ id: V2V_WEB_VM.id }] })

// The web VM is new, the DB one resumed
const WEB_AND_DB_LIST = createV2vMigrationList({ vms: [{ id: V2V_WEB_VM.id }, { id: V2V_DB_VM.id }] })

// The DB VM is warm synced on the pool of the list, the listed one migrated
const IMPORT_VMS = [
  createV2vImportVm({ isWarm: true, sourceVmId: V2V_DB_VM.id }, { id: 'xo-vm-db' as FrontXoVm['id'], $pool: POOL.id }),
  createV2vImportVm({ isWarm: false, sourceVmId: V2V_LISTED_VM.id }, { id: 'xo-vm-listed' as FrontXoVm['id'] }),
]

async function mountSelectedVms({
  list = LIST,
  pool = POOL.id,
}: { list?: V2vMigrationList | null; pool?: FrontXoPool['id'] | null } = {}) {
  destinationCollectionsMock.pools.value = [POOL, OTHER_POOL]
  destinationCollectionsMock.srs.value = [SR]
  destinationCollectionsMock.networks.value = [NETWORK]
  v2vVmRowsCollectionsMock.vms.value = IMPORT_VMS

  return mountV2vVmsStep(
    () => ({ ...useV2vSelectedVms(useV2vVmsStep().selectedVmsContext), labels: useV2vVmLabels() }),
    { list, query: { pool: pool ?? undefined } }
  )
}

type SelectedVms = Awaited<ReturnType<typeof mountSelectedVms>>['result']

function findItemIds(result: SelectedVms) {
  return getV2vVmIds(result.items)
}

beforeEach(() => {
  localStorage.clear()
  v2vVmRowsCollectionsMock.reset()
  destinationCollectionsMock.reset()
  deleteModalMock.reset()
})

describe('items', () => {
  it('lists the VMs in the list order, named after the inventory', async () => {
    const { result } = await mountSelectedVms({
      list: createV2vMigrationList({ vms: [{ id: V2V_DB_VM.id }, { id: V2V_WEB_VM.id }] }),
    })

    expect(result.items.map(({ id, name }) => ({ id, name }))).toEqual([
      { id: V2V_DB_VM.id, name: V2V_DB_VM.name },
      { id: V2V_WEB_VM.id, name: V2V_WEB_VM.name },
    ])
  })

  it('names a VM gone from the inventory by its id', async () => {
    const { result } = await mountSelectedVms({ list: createV2vMigrationList({ vms: [{ id: GONE_VM_ID }] }) })

    expect(result.items.map(item => item.name)).toEqual([GONE_VM_ID])
  })

  it('tags each VM as new or resumed', async () => {
    const { result } = await mountSelectedVms({ list: WEB_AND_DB_LIST })

    expect(result.items.map(item => item.kind)).toEqual([
      result.labels.getKindTag('new'),
      result.labels.getKindTag('resume'),
    ])
  })

  it('maps a new VM to the defaults of the list and locks the mapping of a resumed one', async () => {
    const { result } = await mountSelectedVms({ list: WEB_AND_DB_LIST })

    expect(result.items.map(item => item.mappingParts)).toEqual([
      result.labels.getMappingParts({
        type: 'defaults',
        diskCount: 1,
        srName: SR.name_label,
        nicCount: 0,
        networkName: NETWORK.name_label,
      }),
      result.labels.getMappingParts({ type: 'locked' }),
    ])
  })

  it('tells the check of each VM', async () => {
    const { result } = await mountSelectedVms({
      list: createV2vMigrationList({
        vms: [{ id: V2V_WEB_VM.id }, { id: V2V_RDM_VM.id }, { id: V2V_LISTED_VM.id }, { id: GONE_VM_ID }],
      }),
    })

    expect(result.items.map(item => item.check)).toEqual([
      result.labels.getCheckInfo({ type: 'ready', level: 'ready' }),
      result.labels.getCheckInfo({ type: 'unsupported', level: 'blocking', reason: 'rdm' }),
      result.labels.getCheckInfo({ type: 'already-migrated', level: 'warning' }),
      result.labels.getCheckInfo({ type: 'not-found', level: 'blocking' }),
    ])
  })

  it('names the pool a VM is partially imported on', async () => {
    const { result } = await mountSelectedVms({ list: WEB_LIST })

    v2vVmRowsCollectionsMock.vms.value = [
      createV2vImportVm({ isWarm: true, sourceVmId: V2V_WEB_VM.id }, { $pool: OTHER_POOL.id }),
    ]

    expect(result.items[0].check.label).toBe(result.t('v2v:partial-import-on-pool', { pool: OTHER_POOL.name_label }))
  })

  it('links each VM to its mapping, keeping the route', async () => {
    const { result, router } = await mountSelectedVms({ list: WEB_LIST })

    expect(router.resolve(result.items[0].mappingRoute).query).toEqual({
      step: 'mapping',
      pool: POOL.id,
      vm: V2V_WEB_VM.id,
    })
  })

  it.each([
    ['an empty list', EMPTY_LIST],
    ['no stored list', null],
  ])('lists no VM for %s', async (_, list) => {
    const { result } = await mountSelectedVms({ list })

    expect(result.items).toEqual([])
  })
})

describe('count', () => {
  it('counts the VMs of the list', async () => {
    const { result } = await mountSelectedVms()

    expect(result.count).toBe(3)
  })

  it.each([
    ['an empty list', EMPTY_LIST],
    ['no stored list', null],
  ])('is zero for %s', async (_, list) => {
    const { result } = await mountSelectedVms({ list })

    expect(result.count).toBe(0)
  })
})

describe('isEmpty', () => {
  it('is false while the list holds VMs', async () => {
    const { result } = await mountSelectedVms()

    expect(result.isEmpty).toBe(false)
  })

  it.each([
    ['an empty list', EMPTY_LIST],
    ['no stored list', null],
  ])('is true for %s', async (_, list) => {
    const { result } = await mountSelectedVms({ list })

    expect(result.isEmpty).toBe(true)
  })
})

describe('isBusy', () => {
  it('is false once the rows are ready', async () => {
    const { result } = await mountSelectedVms()

    expect(result.isBusy).toBe(false)
  })

  it.each([
    ['VMs', 'areVmsReady'],
    ['tasks', 'areTasksReady'],
    ['snapshots', 'areSnapshotsReady'],
  ] as const)('is true while the XO %s load', async (_, readyFlag) => {
    v2vVmRowsCollectionsMock[readyFlag].value = false

    const { result } = await mountSelectedVms()

    expect(result.isBusy).toBe(true)
  })
})

describe('readinessTags', () => {
  it('counts the VMs of each readiness level', async () => {
    const { result } = await mountSelectedVms({
      list: createV2vMigrationList({
        vms: [{ id: V2V_WEB_VM.id }, { id: V2V_DB_VM.id }, { id: V2V_LISTED_VM.id }, { id: V2V_RDM_VM.id }],
      }),
    })

    expect(result.readinessTags).toEqual(result.labels.getReadinessTags({ ready: 2, warning: 1, blocking: 1 }))
  })

  it('has no tag for an empty list', async () => {
    const { result } = await mountSelectedVms({ list: EMPTY_LIST })

    expect(result.readinessTags).toEqual([])
  })
})

describe('lockSummary', () => {
  it('locks the source and the pool while the list holds VMs', async () => {
    const { result } = await mountSelectedVms()

    expect(result.lockSummary).toEqual({
      sourceHost: createV2vConnection().host,
      poolName: POOL.name_label,
      isLocked: true,
    })
  })

  it('unlocks them once the list is empty', async () => {
    const { result } = await mountSelectedVms({ list: EMPTY_LIST })

    expect(result.lockSummary.isLocked).toBe(false)
  })

  it('names no pool while the pools load', async () => {
    const { result } = await mountSelectedVms()

    destinationCollectionsMock.pools.value = []
    destinationCollectionsMock.arePoolsReady.value = false

    expect(result.lockSummary.poolName).toBeUndefined()
    expect(findItemIds(result)).toEqual(LIST_IDS)
  })

  it('names no pool before one is chosen', async () => {
    const { result } = await mountSelectedVms({ pool: null })

    expect(result.lockSummary).toEqual({ sourceHost: createV2vConnection().host, poolName: undefined, isLocked: false })
  })
})

describe('remove', () => {
  it('asks to confirm the removal of the VM, by its name', async () => {
    deleteModalMock.answer('onCancel')
    const { result } = await mountSelectedVms()

    await result.remove(V2V_WEB_VM.id)

    expect(deleteModalMock.open).toHaveBeenCalledWith({
      props: {
        subject: result.t('v2v:name-from-migration-list', { name: V2V_WEB_VM.name }),
        confirmLabel: result.t('action:remove'),
        description: result.t('v2v:remove-from-list-info'),
      },
    })
  })

  it('removes the VM once confirmed', async () => {
    deleteModalMock.answer('onConfirm')
    const { result } = await mountSelectedVms()

    await result.remove(V2V_WEB_VM.id)

    expect(findItemIds(result)).toEqual([V2V_DB_VM.id, V2V_RDM_VM.id])
  })

  it('keeps the VM when cancelled', async () => {
    deleteModalMock.answer('onCancel')
    const { result } = await mountSelectedVms()

    await result.remove(V2V_WEB_VM.id)

    expect(findItemIds(result)).toEqual(LIST_IDS)
  })
})

describe('clear', () => {
  it('asks to confirm clearing all the VMs', async () => {
    deleteModalMock.answer('onCancel')
    const { result } = await mountSelectedVms()

    await result.clear()

    expect(deleteModalMock.open).toHaveBeenCalledWith({
      props: {
        subject: result.t('v2v:name-from-migration-list', { name: result.t('n-vms', { n: 3 }) }),
        confirmLabel: result.t('action:clear'),
        description: result.t('v2v:remove-from-list-info'),
      },
    })
  })

  it('empties the list once confirmed, keeping its defaults', async () => {
    deleteModalMock.answer('onConfirm')
    const { result } = await mountSelectedVms()

    await result.clear()

    expect(result.items).toEqual([])
    expect(readV2vMigrationListStorage()).toMatchObject({ vms: [], defaults: LIST.defaults })
  })

  it('keeps the list when cancelled', async () => {
    deleteModalMock.answer('onCancel')
    const { result } = await mountSelectedVms()

    await result.clear()

    expect(findItemIds(result)).toEqual(LIST_IDS)
  })
})
