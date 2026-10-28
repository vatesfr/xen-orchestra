import V2vMappingStep from '@/modules/v2v/components/mapping/V2vMappingStep.vue'
import V2vMappingVmHeader from '@/modules/v2v/components/mapping/V2vMappingVmHeader.vue'
import V2vNewVmMapping from '@/modules/v2v/components/mapping/V2vNewVmMapping.vue'
import V2vResumedVmMapping from '@/modules/v2v/components/mapping/V2vResumedVmMapping.vue'
import V2vSelectedVmsPanel from '@/modules/v2v/components/selected-vms/V2vSelectedVmsPanel.vue'
import V2vShowSelectedVmsButton from '@/modules/v2v/components/selected-vms/V2vShowSelectedVmsButton.vue'
import { getButton, getUiButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { deleteModalMock } from '@/test/mock-delete-modal.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { v2vVmRowsCollectionsMock } from '@/test/mock-xo-v2v-vm-rows-collections.ts'
import { mountOnV2vWizard } from '@/test/mount-on-v2v-wizard.ts'
import { mountV2vMappingStep } from '@/test/mount-v2v-mapping-step.ts'
import { V2V_DB_IMPORT_VM, V2V_GONE_VM_ID, V2V_MAPPING_STEP_LIST } from '@/test/v2v-mapping-step-fixtures.ts'
import { readV2vMigrationListStorage, readV2vMigrationListVmIds } from '@/test/v2v-migration-list-storage.ts'
import { V2V_DB_VM, V2V_WEB_VM } from '@/test/v2v-vms-fixtures.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import type { Router } from 'vue-router'

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
vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(import('@core/composables/modals/use-delete-modal.ts'), () => import('@/test/mock-delete-modal.ts'))

// The children render what the step hands them, each covered by its own test: here only the wiring matters
async function mountStep(vm: string) {
  const { mounted: wrapper, router } = await mountV2vMappingStep(
    setup =>
      mountOnV2vWizard(
        router =>
          mount(V2vMappingStep, {
            global: createGlobalTestConfig({
              router,
              stubs: {
                V2vMappingVmHeader: true,
                V2vNewVmMapping: true,
                V2vResumedVmMapping: true,
                V2vSelectedVmsPanel: true,
              },
            }),
          }),
        setup
      ),
    { vm }
  )

  return { wrapper, router }
}

const MAPPINGS = [V2vNewVmMapping, V2vResumedVmMapping, VtsStateHero]

function findShownMappings(wrapper: VueWrapper) {
  return MAPPINGS.filter(mapping => wrapper.findComponent(mapping).exists())
}

function getPanel(wrapper: VueWrapper) {
  return wrapper.getComponent(V2vSelectedVmsPanel)
}

function findRouteQuery(router: Router) {
  return router.currentRoute.value.query
}

beforeEach(() => {
  v2vVmRowsCollectionsMock.reset()
  destinationCollectionsMock.reset()
  deleteModalMock.reset()
  deleteModalMock.answer('onConfirm')
})

describe('mapping', () => {
  it('maps a new VM on the list', async () => {
    const { wrapper } = await mountStep(V2V_WEB_VM.id)
    const mapping = wrapper.getComponent(V2vNewVmMapping)

    expect(findShownMappings(wrapper)).toEqual([V2vNewVmMapping])
    expect(mapping.props()).toMatchObject({ vm: V2V_WEB_VM, list: V2V_MAPPING_STEP_LIST })
    expect(mapping.props('heading').name).toBe(V2V_WEB_VM.name)
  })

  it('stores the changes of the mapping of a new VM in the list', async () => {
    const { wrapper } = await mountStep(V2V_WEB_VM.id)

    wrapper.getComponent(V2vNewVmMapping).props('updateVm')(V2V_WEB_VM.id, vm => ({ ...vm, keepMac: false }))

    expect(readV2vMigrationListStorage().vms[0]).toEqual({ id: V2V_WEB_VM.id, keepMac: false })
  })

  it('removes a new VM from the list, then shows the next one', async () => {
    const { wrapper, router } = await mountStep(V2V_WEB_VM.id)

    wrapper.getComponent(V2vNewVmMapping).vm.$emit('remove')
    await flushPromises()

    expect(readV2vMigrationListVmIds()).toEqual([V2V_DB_VM.id, V2V_GONE_VM_ID])
    expect(findRouteQuery(router).vm).toBe(V2V_DB_VM.id)
  })

  it('resumes a VM warm synced on the pool of the list', async () => {
    const { wrapper } = await mountStep(V2V_DB_VM.id)

    expect(findShownMappings(wrapper)).toEqual([V2vResumedVmMapping])
    expect(wrapper.getComponent(V2vResumedVmMapping).props()).toMatchObject({
      vm: V2V_DB_VM,
      importVm: V2V_DB_IMPORT_VM,
    })
  })

  it('tells a VM gone from the source not found, removable from the list', async () => {
    const { wrapper } = await mountStep(V2V_GONE_VM_ID)
    const header = wrapper.getComponent(V2vMappingVmHeader)

    expect(findShownMappings(wrapper)).toEqual([VtsStateHero])
    expect(wrapper.getComponent(VtsStateHero).text()).toBe(t('v2v:not-found-in-source'))
    expect(header.props()).toMatchObject({ heading: { name: V2V_GONE_VM_ID }, action: 'remove' })

    header.vm.$emit('remove')
    await flushPromises()

    expect(readV2vMigrationListVmIds()).toEqual([V2V_WEB_VM.id, V2V_DB_VM.id])
  })

  it('shows the step busy while the VMs load', async () => {
    v2vVmRowsCollectionsMock.areVmsReady.value = false

    const { wrapper } = await mountStep(V2V_WEB_VM.id)

    expect(findShownMappings(wrapper)).toEqual([VtsStateHero])
    expect(wrapper.getComponent(VtsStateHero).props('type')).toBe('busy')
  })
})

describe('selected VMs', () => {
  it('shows the VMs of the list, the active one selected', async () => {
    const { wrapper } = await mountStep(V2V_DB_VM.id)

    expect(
      getPanel(wrapper)
        .props('items')
        .map(item => item.isSelected)
    ).toEqual([false, true, false])
    expect(getPanel(wrapper).props()).toMatchObject({ count: 3, isEmpty: false, isBusy: false })
  })

  it('removes a VM of the list from the panel', async () => {
    const { wrapper } = await mountStep(V2V_WEB_VM.id)

    getPanel(wrapper).vm.$emit('remove', V2V_DB_VM.id)
    await flushPromises()

    expect(readV2vMigrationListVmIds()).toEqual([V2V_WEB_VM.id, V2V_GONE_VM_ID])
  })

  it('clears the list from the panel', async () => {
    const { wrapper } = await mountStep(V2V_WEB_VM.id)

    getPanel(wrapper).vm.$emit('clear')
    await flushPromises()

    expect(readV2vMigrationListVmIds()).toEqual([])
  })

  it('lays the panel out as the side panel of the step, beside the mapping', async () => {
    const layout = (await mountStep(V2V_WEB_VM.id)).wrapper.getComponent(VtsContentSidePanel)

    expect(layout.findComponent(V2vSelectedVmsPanel).exists()).toBe(true)
    expect(layout.findComponent(V2vNewVmMapping).exists()).toBe(true)
  })

  it('offers to show the panel, counting the VMs of the list', async () => {
    const { wrapper } = await mountStep(V2V_WEB_VM.id)

    expect(wrapper.getComponent(V2vShowSelectedVmsButton).props('count')).toBe(V2V_MAPPING_STEP_LIST.vms.length)
  })
})

describe('navigation', () => {
  it('goes back to the VMs', async () => {
    const { wrapper, router } = await mountStep(V2V_WEB_VM.id)

    await getButton(wrapper, t('action:back')).trigger('click')
    await flushPromises()

    expect(findRouteQuery(router).step).toBe('vms')
  })

  it('goes on to the review, even with an incomplete mapping', async () => {
    const { wrapper, router } = await mountStep(V2V_WEB_VM.id)
    destinationCollectionsMock.srs.value = []
    await flushPromises()
    const nextButton = getUiButton(wrapper, t('action:next-review'))

    await nextButton.trigger('click')
    await flushPromises()

    expect(nextButton.props('disabled')).toBeFalsy()
    expect(findRouteQuery(router).step).toBe('review')
  })
})
