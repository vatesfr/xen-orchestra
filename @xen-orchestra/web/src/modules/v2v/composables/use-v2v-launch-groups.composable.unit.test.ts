import { useV2vLaunchGroups } from '@/modules/v2v/composables/use-v2v-launch-groups.composable.ts'
import { useV2vMigrationListRows } from '@/modules/v2v/composables/use-v2v-migration-list-rows.composable.ts'
import { useV2vReviewLabels } from '@/modules/v2v/composables/use-v2v-review-labels.composable.ts'
import { useV2vSelectedVmLabels } from '@/modules/v2v/composables/use-v2v-selected-vm-labels.composable.ts'
import { useV2vSelectedVms } from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { getV2vVmIds } from '@/test/create-v2v-vm-row.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { v2vVmRowsCollectionsMock } from '@/test/mock-xo-v2v-vm-rows-collections.ts'
import { mountV2vListStepComposable, type MountV2vListStepOptions } from '@/test/mount-v2v-list-step.ts'
import { resetV2vCollectionMocks } from '@/test/reset-v2v-collection-mocks.ts'
import { V2V_DEFAULT_SR, V2V_SSD_SR } from '@/test/v2v-mapping-fixtures.ts'
import { V2V_DB_SYNC_SNAPSHOT, V2V_GONE_VM_ID, V2V_MAPPING_STEP_INVENTORY } from '@/test/v2v-mapping-step-fixtures.ts'
import {
  createV2vReviewStepList,
  V2V_CUTOVER_SNAPSHOT,
  V2V_MIGRATED_IMPORT_VM,
  V2V_MIGRATED_VM_POOL,
  V2V_MIGRATED_VM_SR,
} from '@/test/v2v-review-step-fixtures.ts'
import { V2V_SELECTED_VM_CHECK } from '@/test/v2v-selected-vm-checks.ts'
import { V2V_DB_VM, V2V_LISTED_VM, V2V_WEB_VM } from '@/test/v2v-vms-fixtures.ts'
import { V2V_LIST_POOL } from '@/test/v2v-wizard-fixtures.ts'
import type { XoV2vDisk } from '@vates/types'

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
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)
vi.mock(
  import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)
vi.mock(
  import('@/modules/vif/remote-resources/use-xo-vif-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)
vi.mock(import('@core/composables/modals/use-delete-modal.ts'), () => import('@/test/mock-delete-modal.ts'))

// The disks of the factory all share one key and chain: the DB VM gets two distinct ones, only the first held by its
// import
const DB_VM_DISTINCT_DISKS_INVENTORY = (() => {
  const [systemDisk, dataDisk] = V2V_DB_VM.disks
  const dbVm = {
    ...V2V_DB_VM,
    disks: [systemDisk, { ...dataDisk, key: 'scsi0:1' as XoV2vDisk['key'], chainPaths: ['db-01/db-01_1.vmdk'] }],
  }

  return {
    ...V2V_MAPPING_STEP_INVENTORY,
    vms: V2V_MAPPING_STEP_INVENTORY.vms.map(vm => (vm.id === dbVm.id ? dbVm : vm)),
  }
})()

function mountLaunchGroups(options?: MountV2vListStepOptions) {
  return mountV2vListStepComposable(
    'review',
    () => {
      const { vms, getRow } = useV2vSelectedVms(useV2vMigrationListRows())

      return {
        ...useV2vLaunchGroups({ vms, getRow }),
        labels: useV2vReviewLabels(),
        selectedVmLabels: useV2vSelectedVmLabels(),
      }
    },
    options
  )
}

beforeEach(() => {
  resetV2vCollectionMocks()
})

describe('confirmSecondCopy', () => {
  it('launches an already migrated VM once confirmed, and no longer counts it as to confirm', async () => {
    const { result } = await mountLaunchGroups()

    expect(result.unconfirmedCount).toBe(1)

    result.confirmSecondCopy(V2V_LISTED_VM.id, true)

    expect(result.unconfirmedCount).toBe(0)
    expect(getV2vVmIds(result.plan.launchable.map(({ item }) => item))).toEqual([
      V2V_WEB_VM.id,
      V2V_DB_VM.id,
      V2V_LISTED_VM.id,
    ])
  })
})

describe('excludedVms', () => {
  it('excludes a blocked VM with the reason the panel gives, linking to its mapping', async () => {
    const { result } = await mountLaunchGroups()

    expect(result.excludedVms).toEqual([
      {
        id: V2V_GONE_VM_ID,
        name: V2V_GONE_VM_ID,
        route: { query: { pool: V2V_LIST_POOL.id, step: 'mapping', vm: V2V_GONE_VM_ID } },
        reason: result.selectedVmLabels.getCheckInfo(V2V_SELECTED_VM_CHECK.notFound).label,
      },
    ])
  })
})

describe('migratedVms', () => {
  it('tells the existing VM, its pool, its SRs and its cutover date, unconfirmed', async () => {
    const { result } = await mountLaunchGroups()

    expect(result.migratedVms).toEqual([
      {
        id: V2V_LISTED_VM.id,
        name: V2V_LISTED_VM.name,
        importVm: { id: V2V_MIGRATED_IMPORT_VM.id, name: V2V_MIGRATED_IMPORT_VM.name_label },
        poolName: V2V_MIGRATED_VM_POOL.name_label,
        srNamesLabel: V2V_MIGRATED_VM_SR.name_label,
        cutoverLabel: result.labels.getCutoverLabel(V2V_CUTOVER_SNAPSHOT.snapshot_time * 1000),
        isConfirmed: false,
      },
    ])
  })

  it('tells no cutover date once its snapshot is gone', async () => {
    const { result } = await mountLaunchGroups()

    v2vVmRowsCollectionsMock.snapshots.value = [V2V_DB_SYNC_SNAPSHOT]

    expect(result.migratedVms[0].cutoverLabel).toBeUndefined()
  })

  it('names a pool and an SR still loading by their ids', async () => {
    const { result } = await mountLaunchGroups()

    xoCollectionsMock.pools.value = [V2V_LIST_POOL]
    xoCollectionsMock.srs.value = [V2V_DEFAULT_SR, V2V_SSD_SR]

    expect(result.migratedVms[0]).toMatchObject({
      poolName: V2V_MIGRATED_VM_POOL.id,
      srNamesLabel: V2V_MIGRATED_VM_SR.id,
    })
  })

  it('is confirmed once the user asks for a second copy, and unconfirmed again', async () => {
    const { result } = await mountLaunchGroups()

    result.confirmSecondCopy(V2V_LISTED_VM.id, true)

    expect(result.migratedVms[0].isConfirmed).toBe(true)

    result.confirmSecondCopy(V2V_LISTED_VM.id, false)

    expect(result.migratedVms[0].isConfirmed).toBe(false)
  })
})

describe('resumedVms', () => {
  it('resumes a warm VM on the pool and the SRs of its import', async () => {
    const { result } = await mountLaunchGroups()

    expect(result.resumedVms).toEqual([
      {
        id: V2V_DB_VM.id,
        name: V2V_DB_VM.name,
        parts: result.labels.getResumedVmParts(DISKOR_POOL_NAME, [V2V_SSD_SR.name_label]),
      },
    ])
  })

  it('leaves out of the SRs of a resumed VM a disk its import does not hold yet', async () => {
    const { result } = await mountLaunchGroups({ inventory: DB_VM_DISTINCT_DISKS_INVENTORY })

    expect(result.resumedVms[0].parts).toEqual(
      result.labels.getResumedVmParts(DISKOR_POOL_NAME, [V2V_SSD_SR.name_label])
    )
  })
})

describe('new VMs', () => {
  it('counts the new VMs and names them with the SRs of their mapping', async () => {
    const { result } = await mountLaunchGroups()

    expect(result.newVmsCount).toBe(1)
    expect(result.newVmsSummary).toBe(result.labels.getNewVmsSummary([V2V_WEB_VM.name], [V2V_DEFAULT_SR.name_label]))
  })

  it('names once an SR several new VMs are mapped to', async () => {
    const { result } = await mountLaunchGroups({
      list: createV2vReviewStepList([{ id: V2V_WEB_VM.id }, { id: V2V_DB_VM.id }]),
      inventory: DB_VM_DISTINCT_DISKS_INVENTORY,
    })

    // Without its import, the DB VM is new too
    v2vVmRowsCollectionsMock.vms.value = []

    expect(result.newVmsCount).toBe(2)
    expect(result.newVmsSummary).toBe(
      result.labels.getNewVmsSummary([V2V_WEB_VM.name, V2V_DB_VM.name], [V2V_DEFAULT_SR.name_label])
    )
  })
})

it('has nothing to group on an empty list', async () => {
  const { result } = await mountLaunchGroups({ list: createV2vReviewStepList([]) })

  expect(result).toMatchObject({
    unconfirmedCount: 0,
    excludedVms: [],
    migratedVms: [],
    resumedVms: [],
    newVmsCount: 0,
  })
})
