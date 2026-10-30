import { useV2vMappingStep } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { createV2vMigrationList } from '@/test/create-v2v-migration-list.ts'
import { getV2vVmIds } from '@/test/create-v2v-vm-row.ts'
import { findV2vRouteQuery } from '@/test/create-v2v-wizard-router.ts'
import { deleteModalMock } from '@/test/mock-delete-modal.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { v2vVmRowsCollectionsMock } from '@/test/mock-xo-v2v-vm-rows-collections.ts'
import { mountComposableOnV2vWizard } from '@/test/mount-on-v2v-wizard.ts'
import { mountV2vListStep } from '@/test/mount-v2v-list-step.ts'
import {
  V2V_DB_IMPORT_VM,
  V2V_DB_SYNC_SNAPSHOT,
  V2V_GONE_VM_ID,
  V2V_MAPPING_STEP_DATACENTER,
  V2V_MAPPING_STEP_INVENTORY,
  V2V_MAPPING_STEP_LIST,
} from '@/test/v2v-mapping-step-fixtures.ts'
import { readV2vMigrationListVmIds } from '@/test/v2v-migration-list-storage.ts'
import { V2V_DB_VM, V2V_WEB_VM } from '@/test/v2v-vms-fixtures.ts'
import type { XoV2vVm } from '@vates/types'
import { flushPromises } from '@vue/test-utils'

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
vi.mock(import('@core/composables/modals/use-delete-modal.ts'), () => import('@/test/mock-delete-modal.ts'))

const SOURCE_HOST = createV2vConnection().host

function mountMappingStep(options?: Parameters<typeof mountV2vListStep>[2]) {
  return mountV2vListStep(
    'mapping',
    setup => mountComposableOnV2vWizard(() => ({ ...useV2vMappingStep(), labels: useV2vVmLabels() }), setup),
    options
  )
}

type MappingStep = Awaited<ReturnType<typeof mountMappingStep>>

async function removeOnceConfirmed({ result }: MappingStep, id: XoV2vVm['id']) {
  deleteModalMock.answer('onConfirm')

  await result.remove(id)
  await flushPromises()
}

beforeEach(() => {
  v2vVmRowsCollectionsMock.reset()
  xoCollectionsMock.reset()
  deleteModalMock.reset()
})

describe('selectedVm', () => {
  it('is the VM of the route', async () => {
    const { result } = await mountMappingStep({ vm: V2V_DB_VM.id })

    expect(result.selectedVm?.id).toBe(V2V_DB_VM.id)
  })

  it.each([
    ['without a VM in the route', undefined],
    ['for a VM out of the list', 'vm-unknown'],
  ])('is undefined %s, the route left as is', async (_, vm) => {
    const step = await mountMappingStep({ vm })

    expect(step.result.selectedVm).toBeUndefined()
    expect(findV2vRouteQuery(step.router).vm).toBe(vm)
  })

  it('maps a new VM on the list, ready', async () => {
    const { result } = await mountMappingStep({ vm: V2V_WEB_VM.id })

    expect(result.selectedVm).toEqual({
      kind: 'new',
      id: V2V_WEB_VM.id,
      heading: {
        locationParts: [SOURCE_HOST, V2V_MAPPING_STEP_DATACENTER.name, 'ds-a'],
        name: V2V_WEB_VM.name,
        statusTag: result.labels.getStatusTag({ migration: 'none' }),
      },
      vm: V2V_WEB_VM,
      list: V2V_MAPPING_STEP_LIST,
      listIssue: undefined,
    })
  })

  it('tells the issue of a new VM in the list', async () => {
    const { result } = await mountMappingStep({ vm: V2V_WEB_VM.id })

    xoCollectionsMock.srs.value = []

    expect(result.selectedVm).toMatchObject({
      kind: 'new',
      listIssue: result.labels.getCheckInfo({ type: 'mapping-incomplete', level: 'blocking' }),
    })
  })

  it('resumes a VM warm synced on the pool of the list, since its last sync', async () => {
    const { result } = await mountMappingStep({ vm: V2V_DB_VM.id })

    expect(result.selectedVm).toEqual({
      kind: 'resume',
      id: V2V_DB_VM.id,
      heading: {
        locationParts: [SOURCE_HOST, V2V_MAPPING_STEP_DATACENTER.name, 'ds-a, ds-b'],
        name: V2V_DB_VM.name,
        statusTag: result.labels.getStatusTag({ migration: 'warm' }),
      },
      vm: V2V_DB_VM,
      importVm: V2V_DB_IMPORT_VM,
      lastSyncAt: V2V_DB_SYNC_SNAPSHOT.snapshot_time * 1000,
    })
  })

  it('tells a VM gone from the source not found, named by its id', async () => {
    const { result } = await mountMappingStep({ vm: V2V_GONE_VM_ID })

    expect(result.selectedVm).toEqual({
      kind: 'not-found',
      id: V2V_GONE_VM_ID,
      heading: { locationParts: [SOURCE_HOST], name: V2V_GONE_VM_ID },
    })
  })

  it.each([
    [
      'the datacenter of a host the inventory lacks',
      { ...V2V_MAPPING_STEP_INVENTORY, hosts: [] },
      [SOURCE_HOST, 'ds-a'],
    ],
    [
      'the datastores of a VM without disk',
      { ...V2V_MAPPING_STEP_INVENTORY, vms: [{ ...V2V_WEB_VM, disks: [], datastoreIds: [] }] },
      [SOURCE_HOST, V2V_MAPPING_STEP_DATACENTER.name],
    ],
  ])('leaves out of the location %s', async (_, inventory, locationParts) => {
    const { result } = await mountMappingStep({ vm: V2V_WEB_VM.id, inventory })

    expect(result.selectedVm?.heading.locationParts).toEqual(locationParts)
  })

  it.each([
    ['the XO VMs', () => (v2vVmRowsCollectionsMock.areVmsReady.value = false)],
    ['the SRs of the pool', () => (xoCollectionsMock.areSrsReady.value = false)],
  ])('is undefined, busy, without rows, while %s load', async (_, holdLoading) => {
    const { result } = await mountMappingStep({ vm: V2V_DB_VM.id })

    holdLoading()

    expect(result.selectedVm).toBeUndefined()
    expect(result.rows).toEqual([])
    expect(result.isBusy).toBe(true)
  })
})

describe('rows', () => {
  it('has a row per VM of the list, in the list order, each with its item of the selected VMs and its VM', async () => {
    const { result } = await mountMappingStep()

    expect(result.rows.map(row => row.item.id)).toEqual([V2V_WEB_VM.id, V2V_DB_VM.id, V2V_GONE_VM_ID])
    expect(result.rows.map(row => [row.vm.id, row.vm.kind])).toEqual([
      [V2V_WEB_VM.id, 'new'],
      [V2V_DB_VM.id, 'resume'],
      [V2V_GONE_VM_ID, 'not-found'],
    ])
  })

  it('maps the VM of each row like the selected one', async () => {
    const { result } = await mountMappingStep({ vm: V2V_DB_VM.id })

    expect(result.rows[1].vm).toEqual(result.selectedVm)
  })

  it('marks the row of the selected VM alone', async () => {
    const { result } = await mountMappingStep({ vm: V2V_DB_VM.id })

    expect(result.rows.map(row => row.item.isSelected)).toEqual([false, true, false])
  })
})

describe('select', () => {
  it('selects a VM through the route', async () => {
    const step = await mountMappingStep()

    step.result.select(V2V_DB_VM.id)
    await flushPromises()

    expect(findV2vRouteQuery(step.router).vm).toBe(V2V_DB_VM.id)
    expect(step.result.selectedVm?.id).toBe(V2V_DB_VM.id)
  })
})

describe('close', () => {
  it('selects no VM any more, out of the route', async () => {
    const step = await mountMappingStep({ vm: V2V_DB_VM.id })

    step.result.close()
    await flushPromises()

    expect(findV2vRouteQuery(step.router).vm).toBeUndefined()
    expect(step.result.selectedVm).toBeUndefined()
  })
})

describe('remove', () => {
  it('keeps the VM and its selection when cancelled', async () => {
    deleteModalMock.answer('onCancel')
    const step = await mountMappingStep({ vm: V2V_WEB_VM.id })

    await step.result.remove(V2V_WEB_VM.id)
    await flushPromises()

    expect(readV2vMigrationListVmIds()).toEqual(getV2vVmIds(V2V_MAPPING_STEP_LIST.vms))
    expect(findV2vRouteQuery(step.router).vm).toBe(V2V_WEB_VM.id)
  })

  it('removes the selected VM, then selects no VM', async () => {
    const step = await mountMappingStep({ vm: V2V_DB_VM.id })

    await removeOnceConfirmed(step, V2V_DB_VM.id)

    expect(readV2vMigrationListVmIds()).toEqual([V2V_WEB_VM.id, V2V_GONE_VM_ID])
    expect(findV2vRouteQuery(step.router).vm).toBeUndefined()
    expect(step.result.selectedVm).toBeUndefined()
  })

  it('removes another VM, keeping the selected one', async () => {
    const step = await mountMappingStep({ vm: V2V_WEB_VM.id })

    await removeOnceConfirmed(step, V2V_DB_VM.id)

    expect(readV2vMigrationListVmIds()).toEqual([V2V_WEB_VM.id, V2V_GONE_VM_ID])
    expect(findV2vRouteQuery(step.router).vm).toBe(V2V_WEB_VM.id)
  })

  it('goes back to the VMs step once the list is empty', async () => {
    const step = await mountMappingStep({
      vm: V2V_WEB_VM.id,
      list: createV2vMigrationList({ ...V2V_MAPPING_STEP_LIST, vms: [{ id: V2V_WEB_VM.id }] }),
    })

    await removeOnceConfirmed(step, V2V_WEB_VM.id)

    expect(readV2vMigrationListVmIds()).toEqual([])
    expect(step.router.currentRoute.value.query.step).toBe('vms')
  })
})

describe('navigation', () => {
  it('goes back to the VMs', async () => {
    const step = await mountMappingStep()

    await step.result.back()

    expect(step.router.currentRoute.value.query.step).toBe('vms')
  })

  it('goes on to the review, even with an incomplete mapping', async () => {
    const step = await mountMappingStep({ vm: V2V_WEB_VM.id })

    xoCollectionsMock.srs.value = []
    await step.result.next()

    expect(step.router.currentRoute.value.query.step).toBe('review')
  })
})
