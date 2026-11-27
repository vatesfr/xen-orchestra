import V2vDestinationMappingCard from '@/modules/v2v/components/mapping/V2vDestinationMappingCard.vue'
import V2vVmChecksCard from '@/modules/v2v/components/mapping/V2vVmChecksCard.vue'
import V2vVmSourceCard from '@/modules/v2v/components/mapping/V2vVmSourceCard.vue'
import V2vNewVmCards from '@/modules/v2v/components/panel/V2vNewVmCards.vue'
import V2vVmOptionsCard from '@/modules/v2v/components/panel/V2vVmOptionsCard.vue'
import { createV2vHost } from '@/test/create-v2v-inventory.ts'
import { createV2vNewMappingStepVm } from '@/test/create-v2v-mapping-step-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { itIsReadyOnceLoaded } from '@/test/hold-loading.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mountV2vVmMappingComponent } from '@/test/mount-v2v-vm-mapping.ts'
import {
  V2V_DEFAULT_TEMPLATE,
  V2V_DISK_ROWS,
  V2V_MIGRATED_VM_TAGS,
  V2V_NIC_ROWS,
  V2V_POOL_OFFERS,
  V2V_TARGET_OPTIONS,
  createV2vOfferedTarget,
} from '@/test/v2v-mapping-fixtures.ts'
import { V2V_LIST_POOL } from '@/test/v2v-wizard-fixtures.ts'
import { mount } from '@vue/test-utils'

mockXoCollections('host', 'network', 'pbd', 'pool', 'sr', 'vmTemplate')

const LIST_ISSUE = { label: 'Import in progress', accent: 'danger' } as const

// The cards render what the container hands them, each covered by its own test: here only the wiring matters
function mountCards() {
  return mountV2vVmMappingComponent((list, router, provide) => {
    const vm = createV2vNewMappingStepVm({ list, listIssue: LIST_ISSUE })

    return {
      vm,
      wrapper: mount(V2vNewVmCards, {
        props: { vm },
        global: createGlobalTestConfig({
          router,
          provide,
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
    poolName: V2V_LIST_POOL.name_label,
    diskRows: V2V_DISK_ROWS,
    nicRows: V2V_NIC_ROWS,
    networkOptions: V2V_TARGET_OPTIONS.networks,
    loading: false,
  })
  expect(card.props('srOptions').map(option => option.id)).toEqual(V2V_POOL_OFFERS.srs.map(sr => sr.id))
})

it('shows the options of the VM', async () => {
  const { wrapper } = await mountCards()

  expect(wrapper.getComponent(V2vVmOptionsCard).props()).toEqual({
    keepMac: true,
    template: createV2vOfferedTarget(V2V_DEFAULT_TEMPLATE.id),
    templateOptions: V2V_TARGET_OPTIONS.templates,
    tags: V2V_MIGRATED_VM_TAGS,
  })
})

describe('the loading of the targets', () => {
  itIsReadyOnceLoaded(
    async () => {
      const { wrapper } = await mountCards()

      return () => wrapper.getComponent(V2vDestinationMappingCard).props('loading')
    },
    [['the templates of the pool', 'templates']],
    { busy: true }
  )
})
