import { useV2vVmRows } from '@/modules/v2v/composables/use-v2v-vm-rows.composable.ts'
import { connectV2vSource } from '@/test/connect-v2v-source.ts'
import { createV2vImportTask } from '@/test/create-task.ts'
import { createV2vImportVm, createV2vPartialImportSnapshot } from '@/test/create-v2v-import-vm.ts'
import { createV2vInventory, createV2vVm } from '@/test/create-v2v-inventory.ts'
import { v2vVmRowsCollectionsMock } from '@/test/mock-xo-v2v-vm-rows-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { XoV2vInventory, XoV2vVm } from '@vates/types'
import { type MaybeRefOrGetter, ref } from 'vue'

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

const VM_1 = createV2vVm({ id: 'vm-1' as XoV2vVm['id'], name: 'app-01' })

const VM_2 = createV2vVm({ id: 'vm-2' as XoV2vVm['id'], name: 'db-01' })

const COLD_IMPORT_VM = createV2vImportVm({ isWarm: false, sourceVmId: VM_1.id })

const INVENTORY = createV2vInventory({ vms: [VM_1, VM_2] })

function mountRows({
  listVmIds = new Set(),
  inventory = INVENTORY,
}: { listVmIds?: MaybeRefOrGetter<Set<XoV2vVm['id']>>; inventory?: XoV2vInventory | null } = {}) {
  return mountComposable(() => {
    if (inventory !== null) {
      connectV2vSource({ inventory })
    }

    return useV2vVmRows(listVmIds)
  }).wrapper.vm
}

function pickStatuses(rows: { name: string; migration: string }[]) {
  return rows.map(row => [row.name, row.migration])
}

beforeEach(() => {
  v2vVmRowsCollectionsMock.reset()
})

describe('rows', () => {
  it('builds one row per inventory VM from its import, its tasks, its snapshots and the list', () => {
    v2vVmRowsCollectionsMock.vms.value = [createV2vImportVm({ isWarm: true, sourceVmId: VM_1.id })]
    v2vVmRowsCollectionsMock.tasks.value = [createV2vImportTask([VM_2.id])]
    v2vVmRowsCollectionsMock.snapshots.value = [createV2vPartialImportSnapshot({ snapshot_time: 100 })]

    const result = mountRows({ listVmIds: new Set([VM_2.id]) })

    expect(
      result.rows.map(row => ({
        name: row.name,
        migration: row.migration,
        lastSyncAt: row.lastSyncAt,
        isInList: row.isInList,
      }))
    ).toEqual([
      { name: VM_1.name, migration: 'warm', lastSyncAt: 100_000, isInList: false },
      { name: VM_2.name, migration: 'running', lastSyncAt: undefined, isInList: true },
    ])
  })

  it('follows a VM turning cold', () => {
    v2vVmRowsCollectionsMock.vms.value = [createV2vImportVm({ isWarm: true, sourceVmId: VM_1.id })]
    const result = mountRows()

    v2vVmRowsCollectionsMock.vms.value = [COLD_IMPORT_VM]

    expect(pickStatuses(result.rows)).toEqual([
      [VM_1.name, 'cold'],
      [VM_2.name, 'none'],
    ])
  })

  it('follows an import task starting', () => {
    const result = mountRows()

    v2vVmRowsCollectionsMock.tasks.value = [createV2vImportTask([VM_2.id])]

    expect(pickStatuses(result.rows)).toEqual([
      [VM_1.name, 'none'],
      [VM_2.name, 'running'],
    ])
  })

  it('follows a VM joining the list', () => {
    const listVmIds = ref(new Set<XoV2vVm['id']>())
    const result = mountRows({ listVmIds })

    listVmIds.value = new Set([VM_1.id])

    expect(result.rows.map(row => row.isInList)).toEqual([true, false])
  })

  it('ignores the imports of another source', () => {
    v2vVmRowsCollectionsMock.vms.value = [
      createV2vImportVm({ isWarm: false, sourceVmId: VM_1.id, sourceId: 'other-source' }),
    ]

    expect(pickStatuses(mountRows().rows)).toEqual([
      [VM_1.name, 'none'],
      [VM_2.name, 'none'],
    ])
  })

  it('has no row without an inventory', () => {
    v2vVmRowsCollectionsMock.vms.value = [COLD_IMPORT_VM]

    expect(mountRows({ inventory: null }).rows).toEqual([])
  })
})

describe('areRowsReady', () => {
  it('is true once every collection is loaded', () => {
    expect(mountRows().areRowsReady).toBe(true)
  })

  it.each([
    ['VMs', () => (v2vVmRowsCollectionsMock.areVmsReady.value = false)],
    ['tasks', () => (v2vVmRowsCollectionsMock.areTasksReady.value = false)],
    ['snapshots', () => (v2vVmRowsCollectionsMock.areSnapshotsReady.value = false)],
  ])('is false while the %s are loading', (_, startLoading) => {
    startLoading()

    expect(mountRows().areRowsReady).toBe(false)
  })
})
