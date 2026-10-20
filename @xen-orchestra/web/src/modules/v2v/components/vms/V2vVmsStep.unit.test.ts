import V2vSelectedVmsPanel from '@/modules/v2v/components/selected-vms/V2vSelectedVmsPanel.vue'
import V2vVmPresets from '@/modules/v2v/components/vms/V2vVmPresets.vue'
import V2vVmsFilterHeader from '@/modules/v2v/components/vms/V2vVmsFilterHeader.vue'
import V2vVmsStep from '@/modules/v2v/components/vms/V2vVmsStep.vue'
import V2vVmsTable from '@/modules/v2v/components/vms/V2vVmsTable.vue'
import { useV2vVmsStep } from '@/modules/v2v/composables/use-v2v-vms-step.composable.ts'
import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { applyV2vPreset, V2V_VM_PRESETS } from '@/modules/v2v/utils/v2v-vm-presets.util.ts'
import { createPool } from '@/test/create-pool.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { createV2vMigrationList } from '@/test/create-v2v-migration-list.ts'
import { getV2vVmIds, getV2vVmNames } from '@/test/create-v2v-vm-row.ts'
import { V2V_VMS_FILTER_QUERY_KEY } from '@/test/create-v2v-wizard-router.ts'
import { findButtonByLabel, getButtonByLabel } from '@/test/find-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { deleteModalMock } from '@/test/mock-delete-modal.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { v2vVmRowsCollectionsMock } from '@/test/mock-xo-v2v-vm-rows-collections.ts'
import { mountOnV2vWizard } from '@/test/mount-on-v2v-wizard.ts'
import { mountV2vVmsStep } from '@/test/mount-v2v-vms-step.ts'
import { readV2vMigrationListStorage } from '@/test/v2v-migration-list-storage.ts'
import { V2V_DATASTORE_B, V2V_LISTED_VM, V2V_VMS_INVENTORY, V2V_WEB_VM } from '@/test/v2v-vms-fixtures.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import { usePanelStore } from '@core/stores/panel.store.ts'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'

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
vi.mock(import('@core/composables/modals/use-delete-modal.ts'), () => import('@/test/mock-delete-modal.ts'))

const LIST = createV2vMigrationList({ vms: [{ id: V2V_LISTED_VM.id }] })

const EMPTY_LIST = createV2vMigrationList()

const POOL = createPool({ id: LIST.poolId })

const DATASTORE_B_FILTER = `datastore:/^${V2V_DATASTORE_B.name}$/`

const DATASTORE_B_AND_NAME_FILTER = `${DATASTORE_B_FILTER} name:${V2V_LISTED_VM.name}`

const SOURCE_HOST = createV2vConnection().host

const SHOW_PANEL_LABEL = t('selected-vms-n', { n: LIST.vms.length })

function getQuery(filter?: string) {
  return { pool: LIST.poolId, [V2V_VMS_FILTER_QUERY_KEY]: filter }
}

// The children render what the step hands them, each covered by its own test: here only the wiring matters
async function mountStep({ list = LIST, filter }: { list?: V2vMigrationList; filter?: string } = {}) {
  destinationCollectionsMock.pools.value = [POOL]

  const { mounted: wrapper, router } = await mountOnV2vWizard(
    router =>
      mount(V2vVmsStep, {
        global: createGlobalTestConfig({
          router,
          stubs: {
            V2vVmsFilterHeader: true,
            VtsQueryBuilder: true,
            V2vVmPresets: true,
            V2vVmsTable: true,
            V2vSelectedVmsPanel: true,
          },
        }),
      }),
    { step: 'vms', query: getQuery(filter), list, source: { inventory: V2V_VMS_INVENTORY } }
  )

  return { wrapper, router }
}

function getFilterHeader(wrapper: VueWrapper) {
  return wrapper.getComponent(V2vVmsFilterHeader)
}

function getQueryBuilder(wrapper: VueWrapper) {
  return wrapper.getComponent(VtsQueryBuilder)
}

function getTable(wrapper: VueWrapper) {
  return wrapper.getComponent(V2vVmsTable)
}

function getPanel(wrapper: VueWrapper) {
  return wrapper.getComponent(V2vSelectedVmsPanel)
}

function findTableView(wrapper: VueWrapper) {
  return getTable(wrapper).props('view')
}

function findPanelItemIds(wrapper: VueWrapper) {
  return getV2vVmIds(getPanel(wrapper).props('items'))
}

function findQueryBuilderFilter(wrapper: VueWrapper) {
  return getQueryBuilder(wrapper).props('modelValue')
}

function getAddButton(wrapper: VueWrapper) {
  return getButtonByLabel(wrapper, t('v2v:action:add-to-migration-list'))
}

function getNextButton(wrapper: VueWrapper) {
  return getButtonByLabel(wrapper, t('action:next-mapping'))
}

function findShowPanelButton(wrapper: VueWrapper) {
  return findButtonByLabel(wrapper, SHOW_PANEL_LABEL)
}

beforeEach(() => {
  localStorage.clear()
  v2vVmRowsCollectionsMock.reset()
  destinationCollectionsMock.reset()
  deleteModalMock.reset()
})

describe('VMs', () => {
  it('shows every VM of the source under the source host', async () => {
    const { wrapper } = await mountStep()

    expect(getFilterHeader(wrapper).props()).toEqual({
      sourceHost: SOURCE_HOST,
      datastoreSummary: undefined,
    })
    expect(findTableView(wrapper).type).toBe('all')
    expect(getV2vVmNames(findTableView(wrapper).rows)).toEqual(getV2vVmNames(V2V_VMS_INVENTORY.vms))
  })

  it('offers the query builder of the VM properties', async () => {
    const { wrapper } = await mountStep()
    const { result: vmsStep } = await mountV2vVmsStep(() => useV2vVmsStep(), { list: LIST, query: getQuery() })

    expect(getQueryBuilder(wrapper).props('schema')).toEqual(vmsStep.schema)
  })

  it('filters the VMs with the query builder', async () => {
    const { wrapper } = await mountStep()

    await getQueryBuilder(wrapper).vm.$emit('search', `name:${V2V_WEB_VM.name}`)

    expect(findQueryBuilderFilter(wrapper)).toBe(`name:${V2V_WEB_VM.name}`)
    expect(getV2vVmNames(findTableView(wrapper).rows)).toEqual([V2V_WEB_VM.name])
  })

  it('offers every preset and applies the chosen one', async () => {
    const { wrapper } = await mountStep()
    const presets = wrapper.getComponent(V2vVmPresets)

    await presets.vm.$emit('apply', 'not-migrated')

    expect(presets.props('presets').map(preset => preset.id)).toEqual(V2V_VM_PRESETS)
    expect(findQueryBuilderFilter(wrapper)).toBe(applyV2vPreset('', 'not-migrated'))
  })

  it('hands the table its state and pagination', async () => {
    v2vVmRowsCollectionsMock.areVmsReady.value = false
    const { wrapper } = await mountStep()
    const table = getTable(wrapper)

    expect(table.props('state')?.type).toBe('busy')
    expect(table.props('paginationBindings')).toMatchObject({ total: V2V_VMS_INVENTORY.vms.length })
  })
})

describe('datastore view', () => {
  it('shows the datastore of the filter in the route', async () => {
    const { wrapper } = await mountStep({ filter: DATASTORE_B_FILTER })

    expect(findTableView(wrapper).type).toBe('datastore')
    expect(getFilterHeader(wrapper).props('datastoreSummary')?.chipLabel).toBe(`datastore:${V2V_DATASTORE_B.name}`)
  })

  it('opens the datastore chosen in the table', async () => {
    const { wrapper } = await mountStep()

    await getTable(wrapper).vm.$emit('filterDatastore', V2V_DATASTORE_B.name)

    expect(findTableView(wrapper).type).toBe('datastore')
  })

  it('leaves the datastore view, keeping the rest of the filter', async () => {
    const { wrapper } = await mountStep({ filter: DATASTORE_B_AND_NAME_FILTER })

    await getFilterHeader(wrapper).vm.$emit('removeDatastore')

    expect(findTableView(wrapper).type).toBe('all')
    expect(findQueryBuilderFilter(wrapper)).toBe(`name:${V2V_LISTED_VM.name}`)
  })

  it('clears the whole filter', async () => {
    const { wrapper } = await mountStep({ filter: DATASTORE_B_AND_NAME_FILTER })

    await getFilterHeader(wrapper).vm.$emit('clearFilter')

    expect(findQueryBuilderFilter(wrapper)).toBe('')
  })
})

describe('adding VMs', () => {
  it('cannot add without selection', async () => {
    const { wrapper } = await mountStep()

    expect(getAddButton(wrapper).props('disabled')).toBe(true)
  })

  it('adds the selected VMs to the migration list', async () => {
    const { wrapper } = await mountStep()
    const selection = getTable(wrapper).props('selection')

    selection.toggle(V2V_WEB_VM.id)
    await flushPromises()
    const addButton = getAddButton(wrapper)
    const isAddDisabled = addButton.props('disabled')
    await addButton.trigger('click')

    expect(isAddDisabled).toBe(false)
    expect(findPanelItemIds(wrapper)).toEqual([V2V_LISTED_VM.id, V2V_WEB_VM.id])
  })
})

describe('selected VMs', () => {
  it('shows the VMs of the migration list', async () => {
    const { wrapper } = await mountStep()

    expect(getPanel(wrapper).props()).toMatchObject({
      count: 1,
      isEmpty: false,
      isBusy: false,
      readinessTags: [{ label: t('n-ready', { n: 1 }), accent: 'success' }],
      lockSummary: { sourceHost: SOURCE_HOST, poolName: POOL.name_label, isLocked: true },
    })
    expect(findPanelItemIds(wrapper)).toEqual([V2V_LISTED_VM.id])
  })

  it('shows the panel busy while the rows load', async () => {
    v2vVmRowsCollectionsMock.areTasksReady.value = false
    const { wrapper } = await mountStep()

    expect(getPanel(wrapper).props('isBusy')).toBe(true)
  })

  it.each([
    ['removes a VM of the list', 'remove', [V2V_LISTED_VM.id]],
    ['clears the list', 'clear', []],
  ] as const)('%s once confirmed', async (_, event, eventArgs) => {
    deleteModalMock.answer('onConfirm')
    const { wrapper } = await mountStep()

    getPanel(wrapper).vm.$emit(event, ...eventArgs)
    await flushPromises()

    expect(readV2vMigrationListStorage().vms).toEqual([])
    expect(findPanelItemIds(wrapper)).toEqual([])
  })

  it('lays the panel out as the side panel of the step, beside the table', async () => {
    const { wrapper } = await mountStep()
    const layout = wrapper.getComponent(VtsContentSidePanel)

    expect(layout.findComponent(V2vSelectedVmsPanel).exists()).toBe(true)
    expect(layout.findComponent(V2vVmsTable).exists()).toBe(true)
  })

  it('has no button to show the panel while it is shown', async () => {
    const { wrapper } = await mountStep()

    expect(findShowPanelButton(wrapper)).toBeUndefined()
  })

  it('shows the panel again from its button once closed', async () => {
    const { wrapper } = await mountStep()
    const panelStore = usePanelStore()

    panelStore.collapse()
    await flushPromises()
    await getButtonByLabel(wrapper, SHOW_PANEL_LABEL).trigger('click')

    expect(panelStore.isExpanded).toBe(true)
    expect(findShowPanelButton(wrapper)).toBeUndefined()
  })
})

describe('navigation', () => {
  it('cannot go on with an empty list', async () => {
    const { wrapper } = await mountStep({ list: EMPTY_LIST })

    expect(getNextButton(wrapper).props('disabled')).toBe(true)
  })

  it('goes on to the mapping with VMs in the list', async () => {
    const { wrapper, router } = await mountStep()
    const nextButton = getNextButton(wrapper)

    await nextButton.trigger('click')
    await flushPromises()

    expect(nextButton.props('disabled')).toBe(false)
    expect(router.currentRoute.value.query.step).toBe('mapping')
  })

  it('goes back to the destination', async () => {
    const { wrapper, router } = await mountStep()

    await getButtonByLabel(wrapper, t('action:back')).trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query.step).toBe('destination')
  })
})
