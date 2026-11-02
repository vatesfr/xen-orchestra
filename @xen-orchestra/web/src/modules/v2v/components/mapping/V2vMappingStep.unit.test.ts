import V2vMappingStep from '@/modules/v2v/components/mapping/V2vMappingStep.vue'
import V2vMappingTable from '@/modules/v2v/components/mapping/V2vMappingTable.vue'
import V2vVmSidePanel from '@/modules/v2v/components/panel/V2vVmSidePanel.vue'
import { findV2vRouteQuery } from '@/test/create-v2v-wizard-router.ts'
import { getButton, getUiButton } from '@/test/get-button.ts'
import { t } from '@/test/i18n.ts'
import { deleteModalMock } from '@/test/mock-delete-modal.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { v2vVmRowsCollectionsMock } from '@/test/mock-xo-v2v-vm-rows-collections.ts'
import { mountComponentOnV2vWizard } from '@/test/mount-on-v2v-wizard.ts'
import { mountV2vListStep } from '@/test/mount-v2v-list-step.ts'
import { readV2vStoredListVm } from '@/test/mount-v2v-vm-mapping.ts'
import { resetV2vCollectionMocks } from '@/test/reset-v2v-collection-mocks.ts'
import { V2V_GONE_VM_ID } from '@/test/v2v-mapping-step-fixtures.ts'
import { readV2vMigrationListVmIds } from '@/test/v2v-migration-list-storage.ts'
import { V2V_DB_VM, V2V_WEB_VM } from '@/test/v2v-vms-fixtures.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { flushPromises, type VueWrapper } from '@vue/test-utils'

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

// The children render what the step hands them, each covered by its own test: here only the wiring matters
async function mountStep(vm?: string) {
  return mountV2vListStep(
    'mapping',
    setup =>
      mountComponentOnV2vWizard(
        V2vMappingStep,
        {
          stubs: {
            V2vMappingTable: true,
            V2vVmSidePanel: true,
          },
        },
        setup
      ),
    { vm }
  )
}

function getTable(wrapper: VueWrapper) {
  return wrapper.getComponent(V2vMappingTable)
}

function getVmPanel(wrapper: VueWrapper) {
  return wrapper.getComponent(V2vVmSidePanel)
}

beforeEach(() => {
  resetV2vCollectionMocks()
  deleteModalMock.answer('onConfirm')
})

describe('table', () => {
  it('lists the VMs of the list', async () => {
    const { wrapper } = await mountStep()

    expect(
      getTable(wrapper)
        .props('rows')
        .map(row => row.vm.id)
    ).toEqual([V2V_WEB_VM.id, V2V_DB_VM.id, V2V_GONE_VM_ID])
  })

  it('selects a VM of the table', async () => {
    const { wrapper, router } = await mountStep()

    getTable(wrapper).vm.$emit('select', V2V_DB_VM.id)
    await flushPromises()

    expect(findV2vRouteQuery(router).vm).toBe(V2V_DB_VM.id)
  })

  it('shows the step busy, without table, while the VMs load', async () => {
    v2vVmRowsCollectionsMock.areVmsReady.value = false

    const { wrapper } = await mountStep(V2V_WEB_VM.id)

    expect(wrapper.getComponent(VtsStateHero).props('type')).toBe('busy')
    expect(wrapper.findComponent(V2vMappingTable).exists()).toBe(false)
  })
})

describe('VM panel', () => {
  it('shows the selected VM in its panel', async () => {
    const { wrapper } = await mountStep(V2V_DB_VM.id)

    expect(getVmPanel(wrapper).props('vm')?.id).toBe(V2V_DB_VM.id)
  })

  it.each([
    ['without a VM in the route', undefined],
    ['for a VM out of the list', 'vm-unknown'],
  ])('shows the panel without VM %s', async (_, vm) => {
    const { wrapper } = await mountStep(vm)

    expect(getVmPanel(wrapper).props('vm')).toBeUndefined()
  })

  it('closes, selecting no VM', async () => {
    const { wrapper, router } = await mountStep(V2V_DB_VM.id)

    getVmPanel(wrapper).vm.$emit('close')
    await flushPromises()

    expect(findV2vRouteQuery(router).vm).toBeUndefined()
    expect(getVmPanel(wrapper).props('vm')).toBeUndefined()
  })

  it('lays the panel out as the side panel of the step, beside the table', async () => {
    const layout = (await mountStep()).wrapper.getComponent(VtsContentSidePanel)

    expect(layout.findComponent(V2vVmSidePanel).exists()).toBe(true)
    expect(layout.findComponent(V2vMappingTable).exists()).toBe(true)
  })
})

// The table and the VM panel edit the settings of a VM and remove a VM of the list, the selected one then closed
describe('list changes', () => {
  it.each([
    ['the table', (wrapper: VueWrapper) => getTable(wrapper).props('updateVm')],
    ['the VM panel', (wrapper: VueWrapper) => getVmPanel(wrapper).props('updateVm')],
  ])('stores the settings of a VM in the list from %s', async (_, getUpdateVm) => {
    const { wrapper } = await mountStep(V2V_DB_VM.id)

    getUpdateVm(wrapper)(V2V_WEB_VM.id, vm => ({ ...vm, keepMac: false }))

    expect(readV2vStoredListVm()).toEqual({ id: V2V_WEB_VM.id, keepMac: false })
  })

  it.each([
    ['the table', getTable],
    ['the VM panel', getVmPanel],
  ])('removes the selected VM of the list from %s, selecting no VM', async (_, getRemover) => {
    const { wrapper, router } = await mountStep(V2V_DB_VM.id)

    getRemover(wrapper).vm.$emit('remove', V2V_DB_VM.id)
    await flushPromises()

    expect(readV2vMigrationListVmIds()).toEqual([V2V_WEB_VM.id, V2V_GONE_VM_ID])
    expect(findV2vRouteQuery(router).vm).toBeUndefined()
  })
})

describe('navigation', () => {
  it('goes back to the VMs', async () => {
    const { wrapper, router } = await mountStep(V2V_WEB_VM.id)

    await getButton(wrapper, t('action:back')).trigger('click')
    await flushPromises()

    expect(findV2vRouteQuery(router).step).toBe('vms')
  })

  it('goes on to the review, even with an incomplete mapping', async () => {
    const { wrapper, router } = await mountStep(V2V_WEB_VM.id)
    xoCollectionsMock.srs.value = []
    await flushPromises()
    const nextButton = getUiButton(wrapper, t('action:next-review'))

    await nextButton.trigger('click')
    await flushPromises()

    expect(nextButton.props('disabled')).toBeFalsy()
    expect(findV2vRouteQuery(router).step).toBe('review')
  })
})
