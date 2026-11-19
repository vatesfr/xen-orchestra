import V2vSelectedVmsPanel from '@/modules/v2v/components/selected-vms/V2vSelectedVmsPanel.vue'
import V2vShowSelectedVmsButton from '@/modules/v2v/components/selected-vms/V2vShowSelectedVmsButton.vue'
import V2vVmPresets from '@/modules/v2v/components/vms/V2vVmPresets.vue'
import V2vVmsFilterHeader from '@/modules/v2v/components/vms/V2vVmsFilterHeader.vue'
import V2vVmsStep from '@/modules/v2v/components/vms/V2vVmsStep.vue'
import V2vVmsTable from '@/modules/v2v/components/vms/V2vVmsTable.vue'
import { useV2vVmsStep } from '@/modules/v2v/composables/use-v2v-vms-step.composable.ts'
import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { applyV2vPreset, V2V_VM_PRESETS } from '@/modules/v2v/utils/v2v-vm-presets.util.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { createV2vListPair } from '@/test/create-v2v-selected-vms.ts'
import { getV2vVmIds, getV2vVmNames } from '@/test/create-v2v-vm-row.ts'
import { findV2vRouteQuery, getV2vVmsQuery } from '@/test/create-v2v-wizard-router.ts'
import { getButton, getUiButton } from '@/test/get-button.ts'
import { t } from '@/test/i18n.ts'
import { deleteModalMock, mockDeleteModal } from '@/test/mock-delete-modal.ts'
import { mockXoCollections } from '@/test/mock-xo-collections.ts'
import { v2vVmRowsCollectionsMock, mockXoV2vVmRowsCollections } from '@/test/mock-xo-v2v-vm-rows-collections.ts'
import { mountComponentOnV2vWizard } from '@/test/mount-on-v2v-wizard.ts'
import { mountV2vVmsStep } from '@/test/mount-v2v-vms-step.ts'
import { resetV2vCollectionMocks } from '@/test/reset-v2v-collection-mocks.ts'
import { seedV2vListPool } from '@/test/seed-v2v-list-pool.ts'
import { readV2vMigrationListStorage } from '@/test/v2v-migration-list-storage.ts'
import {
  V2V_DATASTORE_B,
  V2V_DATASTORE_B_FILTER,
  V2V_LISTED_VM,
  V2V_LIST_WITH_LISTED_VM,
  V2V_VMS_INVENTORY,
  V2V_WEB_VM,
} from '@/test/v2v-vms-fixtures.ts'
import { V2V_EMPTY_LIST } from '@/test/v2v-wizard-fixtures.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import { flushPromises, type VueWrapper } from '@vue/test-utils'

mockXoV2vVmRowsCollections()
mockXoCollections('network', 'pool', 'sr', 'vmTemplate')
mockDeleteModal()

const DATASTORE_B_AND_NAME_FILTER = `${V2V_DATASTORE_B_FILTER} name:${V2V_LISTED_VM.name}`

const SOURCE_HOST = createV2vConnection().host

// The children render what the step hands them, each covered by its own test: here only the wiring matters
async function mountStep({
  list = V2V_LIST_WITH_LISTED_VM,
  filter,
}: { list?: V2vMigrationList; filter?: string } = {}) {
  seedV2vListPool()

  return mountComponentOnV2vWizard(
    V2vVmsStep,
    {
      stubs: {
        V2vVmsFilterHeader: true,
        VtsQueryBuilder: true,
        V2vVmPresets: true,
        V2vVmsTable: true,
        V2vSelectedVmsPanel: true,
      },
    },
    {
      step: 'vms',
      query: getV2vVmsQuery(V2V_LIST_WITH_LISTED_VM.poolId, filter),
      list,
      source: { inventory: V2V_VMS_INVENTORY },
    }
  )
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
  return getUiButton(wrapper, t('v2v:action:add-to-migration-list'))
}

function getNextButton(wrapper: VueWrapper) {
  return getUiButton(wrapper, t('action:next-mapping'))
}

beforeEach(() => {
  resetV2vCollectionMocks()
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
    const { result: vmsStep } = await mountV2vVmsStep(() => useV2vVmsStep(), {
      list: V2V_LIST_WITH_LISTED_VM,
      query: getV2vVmsQuery(V2V_LIST_WITH_LISTED_VM.poolId),
    })

    expect(getQueryBuilder(wrapper).props('schema')).toEqual(vmsStep.schema)
  })

  it('filters the VMs with the query builder', async () => {
    const { wrapper } = await mountStep()

    const queryBuilder = getQueryBuilder(wrapper)

    await queryBuilder.vm.$emit('update:modelValue', `name:${V2V_WEB_VM.name}`)
    await queryBuilder.vm.$emit('search')

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
    const { wrapper } = await mountStep({ filter: V2V_DATASTORE_B_FILTER })

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
      isBusy: false,
      readinessTags: [{ label: t('n-ready', { n: 1 }), accent: 'success' }],
      listPair: createV2vListPair(),
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

  it('offers to show the panel, counting the VMs of the list', async () => {
    const { wrapper } = await mountStep()

    expect(wrapper.getComponent(V2vShowSelectedVmsButton).props('count')).toBe(V2V_LIST_WITH_LISTED_VM.vms.length)
  })
})

describe('navigation', () => {
  it('cannot go on with an empty list', async () => {
    const { wrapper } = await mountStep({ list: V2V_EMPTY_LIST })

    expect(getNextButton(wrapper).props('disabled')).toBe(true)
  })

  it('goes on to the mapping with VMs in the list', async () => {
    const { wrapper, router } = await mountStep()
    const nextButton = getNextButton(wrapper)

    await nextButton.trigger('click')
    await flushPromises()

    expect(nextButton.props('disabled')).toBe(false)
    expect(findV2vRouteQuery(router).step).toBe('mapping')
  })

  it('goes back to the destination', async () => {
    const { wrapper, router } = await mountStep()

    await getButton(wrapper, t('action:back')).trigger('click')
    await flushPromises()

    expect(findV2vRouteQuery(router).step).toBe('destination')
  })
})
