import { useV2vVmsStep } from '@/modules/v2v/composables/use-v2v-vms-step.composable.ts'
import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { getV2vMigrationListStorageKey } from '@/modules/v2v/utils/v2v-migration-list.util.ts'
import { ONE_GB } from '@/shared/constants.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { createV2vImportVm } from '@/test/create-v2v-import-vm.ts'
import { createV2vInventory } from '@/test/create-v2v-inventory.ts'
import { createV2vMigrationList } from '@/test/create-v2v-migration-list.ts'
import { getV2vVmIds, getV2vVmNames } from '@/test/create-v2v-vm-row.ts'
import { V2V_VMS_FILTER_QUERY_KEY } from '@/test/create-v2v-wizard-router.ts'
import { writeLocalStorageFromAnotherTab } from '@/test/local-storage.ts'
import { v2vVmRowsCollectionsMock } from '@/test/mock-xo-v2v-vm-rows-collections.ts'
import { mountV2vVmsStep } from '@/test/mount-v2v-vms-step.ts'
import { readV2vMigrationListStorage } from '@/test/v2v-migration-list-storage.ts'
import {
  V2V_DATASTORE_B,
  V2V_DB_VM,
  V2V_LISTED_VM,
  V2V_RDM_VM,
  V2V_VMS_INVENTORY,
  V2V_WEB_VM,
} from '@/test/v2v-vms-fixtures.ts'
import type { XoV2vInventory, XoV2vVm } from '@vates/types'
import { flushPromises } from '@vue/test-utils'
import { toValue } from 'vue'

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

const LIST = createV2vMigrationList({ vms: [{ id: V2V_LISTED_VM.id }] })

const DS_B_FILTER = 'datastore:/^ds-b$/'

async function mountVmsStep({
  filter,
  inventory = V2V_VMS_INVENTORY,
  list = LIST,
}: { filter?: string; inventory?: XoV2vInventory | null; list?: V2vMigrationList | null } = {}) {
  v2vVmRowsCollectionsMock.vms.value = [createV2vImportVm({ isWarm: true, sourceVmId: V2V_DB_VM.id })]

  return mountV2vVmsStep(() => useV2vVmsStep(), {
    list,
    inventory,
    query: { pool: LIST.poolId, [V2V_VMS_FILTER_QUERY_KEY]: filter },
  })
}

type VmsStep = Awaited<ReturnType<typeof mountVmsStep>>['result']

function findSelectedNames(result: VmsStep) {
  return getV2vVmNames(result.tableView.rows.filter(row => row.isSelected))
}

function findPageRow(result: VmsStep, id: XoV2vVm['id']) {
  const row = result.tableView.rows.find(pageRow => pageRow.id === id)

  if (row === undefined) {
    throw new Error(`No row of VM "${id}" on the page`)
  }

  return row
}

function findListedIds() {
  return getV2vVmIds(readV2vMigrationListStorage().vms)
}

// The VMs on the datastore B: the DB one (warm), the RDM one and the listed one (not migrated)
function expectedDatastoreBSummaryLabels(result: VmsStep) {
  return [result.t('n-vms', { n: 3 }), result.t('n-not-migrated', { n: 2 }), result.t('n-partially-migrated', { n: 1 })]
}

beforeEach(() => {
  localStorage.clear()
  v2vVmRowsCollectionsMock.reset()
})

describe('tableView', () => {
  it('pages the rows matching the filter', async () => {
    const { result } = await mountVmsStep({ filter: DS_B_FILTER })

    expect(getV2vVmNames(result.tableView.rows)).toEqual([V2V_DB_VM.name, V2V_RDM_VM.name, V2V_LISTED_VM.name])
  })

  it('marks the VMs of the list', async () => {
    const { result } = await mountVmsStep()

    expect(getV2vVmNames(result.tableView.rows.filter(row => row.isInList))).toEqual([V2V_LISTED_VM.name])
  })

  it('marks no VM of the list when no list is stored', async () => {
    const { result } = await mountVmsStep({ list: null })

    expect(result.tableView.rows.some(row => row.isInList)).toBe(false)
  })

  it('does not let select an unsupported VM nor a VM of the list', async () => {
    const { result } = await mountVmsStep()

    expect(result.tableView.type).toBe('all')
    expect(getV2vVmNames(result.tableView.rows.filter(row => !row.isSelectable))).toEqual([
      V2V_RDM_VM.name,
      V2V_LISTED_VM.name,
    ])
  })

  it('tells what concerns the datastore of the datastore view', async () => {
    const { result } = await mountVmsStep({ filter: DS_B_FILTER })

    expect(result.tableView).toMatchObject({
      type: 'datastore',
      rows: [
        { id: V2V_DB_VM.id, isSelectable: true, otherDatastores: ['ds-a'], sizeOnDatastore: 20 * ONE_GB },
        { id: V2V_RDM_VM.id, isSelectable: false, otherDatastores: [], sizeOnDatastore: 40 * ONE_GB },
        { id: V2V_LISTED_VM.id, isSelectable: false, otherDatastores: [], sizeOnDatastore: 60 * ONE_GB },
      ],
    })
  })
})

describe('sourceHost', () => {
  it('names the source host', async () => {
    const { result } = await mountVmsStep()

    expect(result.sourceHost).toBe(createV2vConnection().host)
  })
})

describe('schema', () => {
  it('offers the datastores of the inventory', async () => {
    const { result } = await mountVmsStep()

    expect(Object.keys(result.schema.datastore.operators.is.values ?? {})).toEqual(['ds-a', 'ds-b'])
  })

  it('offers no datastore without inventory', async () => {
    const { result } = await mountVmsStep({ inventory: null })

    expect(result.schema.datastore.operators.is.values).toEqual({})
  })
})

describe('filter', () => {
  it('lives in the route', async () => {
    const { result, router } = await mountVmsStep()

    result.filter = DS_B_FILTER
    await flushPromises()

    expect(router.currentRoute.value.query[V2V_VMS_FILTER_QUERY_KEY]).toBe(DS_B_FILTER)
  })

  it('removes the datastore clause only', async () => {
    const { result } = await mountVmsStep({ filter: `name:db ${DS_B_FILTER}` })

    result.removeDatastoreFilter()

    expect(result.filter).toBe('name:db')
  })

  it('clears the whole filter', async () => {
    const { result } = await mountVmsStep({ filter: `name:db ${DS_B_FILTER}` })

    result.clearFilter()

    expect(result.filter).toBe('')
  })

  it('filters by a datastore, keeping the other clauses', async () => {
    const { result } = await mountVmsStep({ filter: 'name:db datastore:/^ds-a$/' })

    result.filterByDatastore(V2V_DATASTORE_B.name)

    expect(result.filter).toBe(`name:db ${DS_B_FILTER}`)
    expect(result.tableView.type).toBe('datastore')
  })
})

describe('selection', () => {
  it('selects every selectable VM of the filter on "select all"', async () => {
    const { result } = await mountVmsStep({ filter: DS_B_FILTER })

    result.selection.bindings.onSelectAll()

    expect(findSelectedNames(result)).toEqual([V2V_DB_VM.name])
    expect(result.selection.bindings.selectedCount).toBe(1)
  })

  it('counts every VM selected once all the selectable ones are', async () => {
    const { result } = await mountVmsStep()

    result.selection.bindings.onSelectAll()

    expect(result.selection.bindings.areAllItemsSelected).toBe(true)
  })

  it('selects every selectable VM of the page from the header checkbox', async () => {
    const { result } = await mountVmsStep()

    result.selection.pageModel.value = true

    expect(findSelectedNames(result)).toEqual([V2V_WEB_VM.name, V2V_DB_VM.name])
  })

  it('toggles a VM', async () => {
    const { result } = await mountVmsStep()

    result.selection.toggle(V2V_WEB_VM.id)

    expect(findSelectedNames(result)).toEqual([V2V_WEB_VM.name])
  })
})

describe('canAddSelected', () => {
  it('cannot add without selection', async () => {
    const { result } = await mountVmsStep()

    expect(result.canAddSelected).toBe(false)
  })

  it('can add once a VM is selected', async () => {
    const { result } = await mountVmsStep()

    result.selection.toggle(V2V_WEB_VM.id)

    expect(result.canAddSelected).toBe(true)
  })
})

describe('addSelected', () => {
  it('adds the selected VMs to the list, then clears the selection', async () => {
    const { result } = await mountVmsStep()

    result.selection.toggle(V2V_WEB_VM.id)
    result.selection.toggle(V2V_DB_VM.id)
    result.addSelected()

    expect(findListedIds()).toEqual([V2V_LISTED_VM.id, V2V_WEB_VM.id, V2V_DB_VM.id])
    expect(result.selection.bindings.selectedCount).toBe(0)
  })

  it('does not select again a VM added then removed from the list', async () => {
    const { result } = await mountVmsStep()

    result.selection.toggle(V2V_WEB_VM.id)
    result.addSelected()
    await writeLocalStorageFromAnotherTab(getV2vMigrationListStorageKey(LIST), JSON.stringify(LIST))

    expect(findPageRow(result, V2V_WEB_VM.id)).toMatchObject({ isSelectable: true, isSelected: false })
  })

  it('adds nothing without selection', async () => {
    const { result } = await mountVmsStep()

    result.addSelected()

    expect(findListedIds()).toEqual([V2V_LISTED_VM.id])
  })
})

describe('datastoreSummary', () => {
  it.each([
    ['one datastore clause', DS_B_FILTER],
    ['one datastore clause among others', `name:db ${DS_B_FILTER}`],
    ['one datastore clause and a preset', `${DS_B_FILTER} migration:/^warm$/`],
  ])('summarizes the VMs on the datastore of %s by status', async (_, filter) => {
    const { result } = await mountVmsStep({ filter })

    expect(result.datastoreSummary).toEqual({
      chipLabel: `datastore:${V2V_DATASTORE_B.name}`,
      summaryLabels: expectedDatastoreBSummaryLabels(result),
    })
  })

  it('keeps summarizing the whole datastore once a preset is applied', async () => {
    const { result } = await mountVmsStep({ filter: DS_B_FILTER })

    result.applyPreset('not-migrated')

    expect(result.datastoreSummary?.summaryLabels).toEqual(expectedDatastoreBSummaryLabels(result))
  })

  it.each([
    ['no filter', undefined],
    ['no datastore clause', 'name:db'],
    ['two datastore clauses', `datastore:/^ds-a$/ ${DS_B_FILTER}`],
    ['a clause of two datastores', 'datastore:|(/^ds-a$/ /^ds-b$/)'],
    ['a datastore missing from the inventory', 'datastore:/^ds-unknown$/'],
  ])('summarizes no datastore for %s', async (_, filter) => {
    const { result } = await mountVmsStep({ filter })

    expect(result.datastoreSummary).toBeUndefined()
    expect(result.tableView.type).toBe('all')
  })

  it('summarizes no datastore without inventory', async () => {
    const { result } = await mountVmsStep({ filter: DS_B_FILTER, inventory: null })

    expect(result.datastoreSummary).toBeUndefined()
  })
})

describe('presets', () => {
  it('counts each preset and marks "All" active without filter', async () => {
    const { result } = await mountVmsStep()

    expect(result.presets).toEqual([
      { id: 'all', label: result.t('all'), count: 4, isActive: true },
      { id: 'not-migrated', label: result.t('not-migrated'), count: 3, isActive: false },
      { id: 'not-ready', label: result.t('not-ready'), count: 1, isActive: false },
      { id: 'in-progress', label: result.t('in-progress'), count: 0, isActive: false },
      { id: 'warm', label: result.t('v2v:status:warm'), count: 1, isActive: false },
      { id: 'cold', label: result.t('v2v:status:cold'), count: 0, isActive: false },
    ])
  })

  it('writes the preset in the filter, keeping the datastore clause, and marks it active', async () => {
    const { result } = await mountVmsStep({ filter: DS_B_FILTER })

    result.applyPreset('not-migrated')

    expect(result.filter).toBe(`${DS_B_FILTER} migration:/^none$/`)
    expect(result.presets.filter(preset => preset.isActive).map(preset => preset.id)).toEqual(['not-migrated'])
  })

  it('marks no preset active for a custom status filter', async () => {
    const { result } = await mountVmsStep({ filter: 'migration:/^none$/ migration:/^warm$/' })

    expect(result.presets.some(preset => preset.isActive)).toBe(false)
  })
})

describe('tableState', () => {
  it('is busy while the rows are loading', async () => {
    v2vVmRowsCollectionsMock.areVmsReady.value = false
    const { result } = await mountVmsStep()

    expect(result.tableState?.type).toBe('busy')
  })

  it('has no state once the rows are ready', async () => {
    const { result } = await mountVmsStep()

    expect(result.tableState).toBeUndefined()
  })

  it('tells the source has no VM', async () => {
    const { result } = await mountVmsStep({ inventory: createV2vInventory({ vms: [] }) })

    expect(result.tableState).toEqual({ type: 'no-data', message: result.t('no-vm-detected') })
  })

  it('tells no VM matches the filter', async () => {
    const { result } = await mountVmsStep({ filter: 'name:nothing' })

    expect(result.tableState?.type).toBe('no-result')
  })
})

describe('selectedVmsContext', () => {
  it('hands its list, rows and their readiness, and pool to the selected VMs', async () => {
    v2vVmRowsCollectionsMock.areVmsReady.value = false
    const { result } = await mountVmsStep()

    const { migrationList, rows, areRowsReady, poolId } = result.selectedVmsContext

    expect(migrationList.list.value?.vms).toEqual(LIST.vms)
    expect(getV2vVmNames(toValue(rows))).toEqual(getV2vVmNames(V2V_VMS_INVENTORY.vms))
    expect(toValue(areRowsReady)).toBe(false)
    expect(toValue(poolId)).toBe(LIST.poolId)
  })
})

describe('navigation', () => {
  it('goes back to the destination, keeping the pool', async () => {
    const { result, router } = await mountVmsStep()

    await result.back()

    expect(router.currentRoute.value.query).toMatchObject({ step: 'destination', pool: LIST.poolId })
  })

  it('goes on to the mapping, keeping the pool and the filter', async () => {
    const { result, router } = await mountVmsStep({ filter: DS_B_FILTER })

    await result.next()

    expect(router.currentRoute.value.query).toMatchObject({
      step: 'mapping',
      pool: LIST.poolId,
      [V2V_VMS_FILTER_QUERY_KEY]: DS_B_FILTER,
    })
  })

  it('can go on with VMs in the list', async () => {
    const { result } = await mountVmsStep()

    expect(result.canGoNext).toBe(true)
  })

  it.each([
    ['an empty list', createV2vMigrationList({ vms: [] })],
    ['no stored list', null],
  ])('cannot go on with %s', async (_, list) => {
    const { result } = await mountVmsStep({ list })

    expect(result.canGoNext).toBe(false)
  })

  it('can go on once a VM is added', async () => {
    const { result } = await mountVmsStep({ list: createV2vMigrationList({ vms: [] }) })

    result.selection.toggle(V2V_WEB_VM.id)
    result.addSelected()
    await flushPromises()

    expect(result.canGoNext).toBe(true)
  })
})
