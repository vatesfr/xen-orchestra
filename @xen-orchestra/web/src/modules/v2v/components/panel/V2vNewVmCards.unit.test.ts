import V2vDestinationMappingCard from '@/modules/v2v/components/mapping/V2vDestinationMappingCard.vue'
import V2vVmChecksCard from '@/modules/v2v/components/mapping/V2vVmChecksCard.vue'
import V2vVmSourceCard from '@/modules/v2v/components/mapping/V2vVmSourceCard.vue'
import V2vNewVmCards from '@/modules/v2v/components/panel/V2vNewVmCards.vue'
import V2vVmOptionsCard from '@/modules/v2v/components/panel/V2vVmOptionsCard.vue'
import { createV2vHost } from '@/test/create-v2v-inventory.ts'
import { createV2vNewMappingStepVm } from '@/test/create-v2v-mapping-step-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountV2vVmMappingComponent, V2V_VM_MAPPING_POOL } from '@/test/mount-v2v-vm-mapping.ts'
import {
  V2V_DEFAULT_TEMPLATE,
  V2V_DISK_ROWS,
  V2V_MIGRATED_VM_TAGS,
  V2V_NIC_ROWS,
  V2V_POOL_OFFERS,
  V2V_TARGET_OPTIONS,
} from '@/test/v2v-mapping-fixtures.ts'
import { mount } from '@vue/test-utils'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
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
  import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

const LIST_ISSUE = { label: 'Import in progress', accent: 'danger' } as const

// The cards render what the container hands them, each covered by its own test: here only the wiring matters
function mountCards() {
  return mountV2vVmMappingComponent((list, router) => {
    const vm = createV2vNewMappingStepVm({ list, listIssue: LIST_ISSUE })

    return {
      vm,
      wrapper: mount(V2vNewVmCards, {
        props: { vm, updateVm: vi.fn() },
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
    }
  })
}

beforeEach(() => {
  xoCollectionsMock.reset()
})

it('shows the source VM on its host', async () => {
  const { vm, wrapper } = await mountCards()

  expect(wrapper.getComponent(V2vVmSourceCard).props()).toEqual({ vm: vm.vm, hostName: createV2vHost().name })
})

it('tells the checks of the source VM, then its issue in the list', async () => {
  const { wrapper } = await mountCards()
  const checks = wrapper.getComponent(V2vVmChecksCard).props('checks')

  expect([checks.length, checks.at(-1)]).toEqual([3, LIST_ISSUE])
})

it('shows the mapping of the disks and the NICs on the pool of the list, read only', async () => {
  const { wrapper } = await mountCards()
  const card = wrapper.getComponent(V2vDestinationMappingCard)

  expect(card.props()).toMatchObject({
    poolName: V2V_VM_MAPPING_POOL.name_label,
    diskRows: V2V_DISK_ROWS,
    nicRows: V2V_NIC_ROWS,
    networkOptions: V2V_TARGET_OPTIONS.networks,
    loading: false,
    readonly: true,
  })
  expect(card.props('srOptions').map(option => option.id)).toEqual(V2V_POOL_OFFERS.srs.map(sr => sr.id))
})

it('shows the options of the VM', async () => {
  const { wrapper } = await mountCards()

  expect(wrapper.getComponent(V2vVmOptionsCard).props()).toEqual({
    keepMac: true,
    template: { value: V2V_DEFAULT_TEMPLATE.id, origin: 'default', isOffered: true },
    templateOptions: V2V_TARGET_OPTIONS.templates,
    tags: V2V_MIGRATED_VM_TAGS,
  })
})

it('shows the targets loading while the pool offers load', async () => {
  xoCollectionsMock.areTemplatesReady.value = false

  const { wrapper } = await mountCards()

  expect(wrapper.getComponent(V2vDestinationMappingCard).props('loading')).toBe(true)
})
