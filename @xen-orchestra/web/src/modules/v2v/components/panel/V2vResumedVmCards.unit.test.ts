import V2vActiveMappingCard from '@/modules/v2v/components/mapping/V2vActiveMappingCard.vue'
import V2vDestinationVmCard from '@/modules/v2v/components/mapping/V2vDestinationVmCard.vue'
import V2vNextRunCard from '@/modules/v2v/components/mapping/V2vNextRunCard.vue'
import V2vResumedVmCards from '@/modules/v2v/components/panel/V2vResumedVmCards.vue'
import { createV2vResumedMappingStepVm } from '@/test/create-v2v-mapping-step-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import { mountOnV2vWizard } from '@/test/mount-on-v2v-wizard.ts'
import { seedV2vResumedVmCollections, V2V_RESUMED_VM_POOL } from '@/test/seed-v2v-resumed-vm.ts'
import { V2V_ACTIVE_MAPPING_ROWS, V2V_MAPPING_INVENTORY, V2V_RESUMED_IMPORT_VM } from '@/test/v2v-mapping-fixtures.ts'
import { mount } from '@vue/test-utils'

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

const VM = createV2vResumedMappingStepVm()

// The cards render what the container hands them, each covered by its own test: here only the wiring matters
async function mountCards() {
  seedV2vResumedVmCollections()

  const { mounted: wrapper } = await mountOnV2vWizard(
    router =>
      mount(V2vResumedVmCards, {
        props: { vm: VM },
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
  xoCollectionsMock.reset()
  vmDeviceCollectionsMock.reset()
})

it('shows the import VM on the pool it was synced to', async () => {
  const card = (await mountCards()).getComponent(V2vDestinationVmCard)

  expect([card.props('vm').id, card.props('poolName')]).toEqual([
    V2V_RESUMED_IMPORT_VM.id,
    V2V_RESUMED_VM_POOL.name_label,
  ])
})

it('tells the next run, since the last sync', async () => {
  const card = (await mountCards()).getComponent(V2vNextRunCard)

  expect(card.props()).toEqual({ transfer: 'delta', lastSyncAt: VM.lastSyncAt })
})

it('shows the mapping of the first sync, locked on the pool', async () => {
  const card = (await mountCards()).getComponent(V2vActiveMappingCard)

  expect(card.props()).toEqual({
    poolName: V2V_RESUMED_VM_POOL.name_label,
    rows: V2V_ACTIVE_MAPPING_ROWS,
    loading: false,
  })
})

it('shows the active mapping loading while the devices of the import VM load', async () => {
  vmDeviceCollectionsMock.areVdisReady.value = false

  const card = (await mountCards()).getComponent(V2vActiveMappingCard)

  expect(card.props('loading')).toBe(true)
})
