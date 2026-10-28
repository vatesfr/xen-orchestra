import V2vDestinationMappingCard from '@/modules/v2v/components/mapping/V2vDestinationMappingCard.vue'
import V2vMappingVmHeader from '@/modules/v2v/components/mapping/V2vMappingVmHeader.vue'
import V2vNewVmMapping from '@/modules/v2v/components/mapping/V2vNewVmMapping.vue'
import V2vVmChecksCard from '@/modules/v2v/components/mapping/V2vVmChecksCard.vue'
import V2vVmOptionsCard from '@/modules/v2v/components/mapping/V2vVmOptionsCard.vue'
import V2vVmSourceCard from '@/modules/v2v/components/mapping/V2vVmSourceCard.vue'
import type { V2vMigrationListVm } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { createPool } from '@/test/create-pool.ts'
import { createV2vHost } from '@/test/create-v2v-inventory.ts'
import { createV2vMappingVmHeading } from '@/test/create-v2v-mapping-vm-heading.ts'
import { createV2vMigrationList, createV2vMigrationListVm } from '@/test/create-v2v-migration-list.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { mountOnV2vWizard } from '@/test/mount-on-v2v-wizard.ts'
import {
  V2V_DEBIAN_TEMPLATE,
  V2V_DEFAULT_TEMPLATE,
  V2V_DISK_OVERRIDES,
  V2V_DISK_ROWS,
  V2V_MAPPED_VM,
  V2V_MAPPING_INVENTORY,
  V2V_NIC_OVERRIDES,
  V2V_NIC_ROWS,
  V2V_POOL_OFFERS,
  V2V_SSD_SR,
  V2V_SYSTEM_DISK,
  V2V_TARGET_OPTIONS,
  V2V_VLAN_NETWORK,
  V2V_LAN_NIC,
} from '@/test/v2v-mapping-fixtures.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
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
  import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)

const POOL = createPool()

// The VM overrides its second disk and its second NIC
const LIST_VM = createV2vMigrationListVm({ id: V2V_MAPPED_VM.id, disks: V2V_DISK_OVERRIDES, nics: V2V_NIC_OVERRIDES })

const LIST = createV2vMigrationList({ poolId: POOL.id, vms: [LIST_VM] })

const HEADING = createV2vMappingVmHeading({ name: V2V_MAPPED_VM.name })

const LIST_ISSUE = { label: 'Import in progress', accent: 'danger' } as const

// The cards render what the container hands them, each covered by its own test: here only the wiring matters
async function mountNewVmMapping() {
  destinationCollectionsMock.pools.value = [POOL]
  destinationCollectionsMock.seedChoices(V2V_POOL_OFFERS)

  const updateVm = vi.fn()

  const { mounted: wrapper } = await mountOnV2vWizard(
    router =>
      mount(V2vNewVmMapping, {
        props: { heading: HEADING, vm: V2V_MAPPED_VM, list: LIST, listIssue: LIST_ISSUE, updateVm },
        global: createGlobalTestConfig({
          router,
          stubs: {
            V2vVmSourceCard: true,
            V2vVmChecksCard: true,
            V2vDestinationMappingCard: true,
            V2vVmOptionsCard: true,
          },
        }),
      }),
    { step: 'mapping', source: { inventory: V2V_MAPPING_INVENTORY } }
  )

  return { wrapper, updateVm }
}

// The list VM once updated: the container hands the list how to update it
function findUpdatedVm(updateVm: ReturnType<typeof vi.fn>): V2vMigrationListVm {
  const [id, getNextVm] = updateVm.mock.lastCall ?? []

  expect(id).toBe(V2V_MAPPED_VM.id)

  return getNextVm(LIST_VM)
}

function getOptionsCard(wrapper: VueWrapper) {
  return wrapper.getComponent(V2vVmOptionsCard)
}

function getDestinationCard(wrapper: VueWrapper) {
  return wrapper.getComponent(V2vDestinationMappingCard)
}

beforeEach(() => {
  destinationCollectionsMock.reset()
})

it('heads the VM, removable from the list', async () => {
  const { wrapper } = await mountNewVmMapping()
  const header = wrapper.getComponent(V2vMappingVmHeader)

  await header.vm.$emit('remove')

  expect(header.props()).toEqual({ heading: HEADING, action: 'remove', busy: false })
  expect(wrapper.emitted('remove')).toEqual([[]])
})

it('shows the source VM on its host', async () => {
  const { wrapper } = await mountNewVmMapping()

  expect(wrapper.getComponent(V2vVmSourceCard).props()).toEqual({ vm: V2V_MAPPED_VM, hostName: createV2vHost().name })
})

it('tells the checks of the source VM, then its issue in the list', async () => {
  const { wrapper } = await mountNewVmMapping()
  const checks = wrapper.getComponent(V2vVmChecksCard).props('checks')

  expect([checks.length, checks.at(-1)]).toEqual([3, LIST_ISSUE])
})

it('maps the disks and the NICs on the targets of the pool of the list', async () => {
  const { wrapper } = await mountNewVmMapping()

  expect(getDestinationCard(wrapper).props()).toMatchObject({
    poolName: POOL.name_label,
    diskRows: V2V_DISK_ROWS,
    nicRows: V2V_NIC_ROWS,
    networkOptions: V2V_TARGET_OPTIONS.networks,
    loading: false,
  })
  expect(
    getDestinationCard(wrapper)
      .props('srOptions')
      .map(option => option.id)
  ).toEqual(V2V_POOL_OFFERS.srs.map(sr => sr.id))
})

it('offers the options of the VM, on their defaults', async () => {
  const { wrapper } = await mountNewVmMapping()

  expect(getOptionsCard(wrapper).props()).toEqual({
    keepMac: true,
    template: { value: V2V_DEFAULT_TEMPLATE.id, origin: 'default', isOffered: true },
    templateOptions: V2V_TARGET_OPTIONS.templates,
    tags: ['migrated-from:vmware'],
    loading: false,
  })
})

it('shows the targets loading while the pool offers load', async () => {
  destinationCollectionsMock.areTemplatesReady.value = false

  const { wrapper } = await mountNewVmMapping()

  expect([getDestinationCard(wrapper).props('loading'), getOptionsCard(wrapper).props('loading')]).toEqual([true, true])
})

it.each([
  [
    'the SR of a disk',
    (wrapper: VueWrapper) => getDestinationCard(wrapper).vm.$emit('changeDiskSr', V2V_SYSTEM_DISK.key, V2V_SSD_SR.id),
    { disks: { ...V2V_DISK_OVERRIDES, [V2V_SYSTEM_DISK.key]: V2V_SSD_SR.id } },
  ],
  [
    'the network of a NIC',
    (wrapper: VueWrapper) =>
      getDestinationCard(wrapper).vm.$emit('changeNicNetwork', V2V_LAN_NIC.key, V2V_VLAN_NETWORK.id),
    { nics: { ...V2V_NIC_OVERRIDES, [V2V_LAN_NIC.key]: V2V_VLAN_NETWORK.id } },
  ],
  [
    'keeping the MAC addresses',
    (wrapper: VueWrapper) => getOptionsCard(wrapper).vm.$emit('changeKeepMac', false),
    { keepMac: false },
  ],
  [
    'the template',
    (wrapper: VueWrapper) => getOptionsCard(wrapper).vm.$emit('changeTemplate', V2V_DEBIAN_TEMPLATE.id),
    { template: V2V_DEBIAN_TEMPLATE.id },
  ],
  ['the tags', (wrapper: VueWrapper) => getOptionsCard(wrapper).vm.$emit('changeTags', ['prod']), { tags: ['prod'] }],
])('stores %s chosen for the VM in the list', async (_, change, overrides) => {
  const { wrapper, updateVm } = await mountNewVmMapping()

  change(wrapper)

  expect(findUpdatedVm(updateVm)).toMatchObject(overrides)
})
