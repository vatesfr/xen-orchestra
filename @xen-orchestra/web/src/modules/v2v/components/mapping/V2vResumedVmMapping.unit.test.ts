import V2vActiveMappingCard from '@/modules/v2v/components/mapping/V2vActiveMappingCard.vue'
import V2vDestinationVmCard from '@/modules/v2v/components/mapping/V2vDestinationVmCard.vue'
import V2vMappingVmHeader from '@/modules/v2v/components/mapping/V2vMappingVmHeader.vue'
import V2vNextRunCard from '@/modules/v2v/components/mapping/V2vNextRunCard.vue'
import V2vResumedVmMapping from '@/modules/v2v/components/mapping/V2vResumedVmMapping.vue'
import { createV2vMappingVmHeading } from '@/test/create-v2v-mapping-vm-heading.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { deleteModalMock } from '@/test/mock-delete-modal.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import { mountOnV2vWizard } from '@/test/mount-on-v2v-wizard.ts'
import { seedV2vResumedVmCollections, V2V_RESUMED_VM_POOL } from '@/test/seed-v2v-resumed-vm.ts'
import {
  V2V_ACTIVE_MAPPING_ROWS,
  V2V_MAPPING_INVENTORY,
  V2V_RESUMED_IMPORT_VM,
  V2V_SYNCED_VM,
} from '@/test/v2v-mapping-fixtures.ts'
import { flushPromises, mount } from '@vue/test-utils'

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

const HEADING = createV2vMappingVmHeading({ name: V2V_SYNCED_VM.name })

const LAST_SYNC_AT = Date.UTC(2026, 9, 2, 14, 40)

// The cards render what the container hands them, each covered by its own test: here only the wiring matters
async function mountResumedVmMapping() {
  seedV2vResumedVmCollections()

  const { mounted: wrapper } = await mountOnV2vWizard(
    router =>
      mount(V2vResumedVmMapping, {
        props: { heading: HEADING, vm: V2V_SYNCED_VM, importVm: V2V_RESUMED_IMPORT_VM, lastSyncAt: LAST_SYNC_AT },
        global: createGlobalTestConfig({
          router,
          stubs: { V2vDestinationVmCard: true, V2vNextRunCard: true, V2vActiveMappingCard: true },
        }),
      }),
    { step: 'mapping', source: { inventory: V2V_MAPPING_INVENTORY } }
  )

  return wrapper
}

beforeEach(() => {
  destinationCollectionsMock.reset()
  vmDeviceCollectionsMock.reset()
  deleteModalMock.reset()
})

it('heads the VM, its import VM deletable', async () => {
  const header = (await mountResumedVmMapping()).getComponent(V2vMappingVmHeader)

  expect(header.props()).toEqual({ heading: HEADING, action: 'delete', busy: false })
})

it('asks to confirm the deletion of the import VM', async () => {
  const wrapper = await mountResumedVmMapping()

  wrapper.getComponent(V2vMappingVmHeader).vm.$emit('delete')

  expect(deleteModalMock.open.mock.lastCall?.[0].props.subject).toBe(V2V_RESUMED_IMPORT_VM.name_label)
})

it('shows its delete action busy while the import VM is deleted', async () => {
  const wrapper = await mountResumedVmMapping()
  const header = wrapper.getComponent(V2vMappingVmHeader)

  header.vm.$emit('delete')
  deleteModalMock.confirm()
  await flushPromises()

  expect(header.props('busy')).toBe(true)
})

it('shows the import VM on the pool it was synced to', async () => {
  const card = (await mountResumedVmMapping()).getComponent(V2vDestinationVmCard)

  expect([card.props('vm').id, card.props('poolName')]).toEqual([
    V2V_RESUMED_IMPORT_VM.id,
    V2V_RESUMED_VM_POOL.name_label,
  ])
})

it('tells the next run, since the last sync', async () => {
  const card = (await mountResumedVmMapping()).getComponent(V2vNextRunCard)

  expect(card.props()).toEqual({ transfer: 'delta', lastSyncAt: LAST_SYNC_AT })
})

it('shows the mapping of the first sync, locked on the pool', async () => {
  const card = (await mountResumedVmMapping()).getComponent(V2vActiveMappingCard)

  expect(card.props()).toEqual({
    poolName: V2V_RESUMED_VM_POOL.name_label,
    rows: V2V_ACTIVE_MAPPING_ROWS,
    loading: false,
  })
})

it('shows the active mapping loading while the devices of the import VM load', async () => {
  vmDeviceCollectionsMock.areVdisReady.value = false

  const card = (await mountResumedVmMapping()).getComponent(V2vActiveMappingCard)

  expect(card.props('loading')).toBe(true)
})
