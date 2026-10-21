import V2vVmsTable from '@/modules/v2v/components/vms/V2vVmsTable.vue'
import type { V2vVmsTableSelection } from '@/modules/v2v/composables/use-v2v-vms-step.composable.ts'
import { buildV2vVmRows, buildV2vVmsTableView } from '@/modules/v2v/utils/v2v-vm-rows.util.ts'
import { createTableSelectionBindings } from '@/test/create-table-selection-bindings.ts'
import { createV2vImportVm, createV2vPartialImportSnapshot } from '@/test/create-v2v-import-vm.ts'
import { createV2vVmRowsInput } from '@/test/create-v2v-vm-row.ts'
import { getButtonByLabel } from '@/test/find-button.ts'
import { findTableColumn, findTableColumnCells, findTableHeaders, findTableRows } from '@/test/find-table-cells.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { d, t } from '@/test/i18n.ts'
import {
  V2V_DATASTORE_B,
  V2V_DB_VM,
  V2V_LISTED_VM,
  V2V_RDM_VM,
  V2V_VMS_INVENTORY,
  V2V_WEB_VM,
} from '@/test/v2v-vms-fixtures.ts'
import UiTableSelection from '@core/components/ui/table-selection/UiTableSelection.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { type DOMWrapper, mount } from '@vue/test-utils'
import { ref } from 'vue'
import type { ComponentProps } from 'vue-component-type-helpers'

const SYNC_TIME = 1_700_000_000

const ROWS = buildV2vVmRows(
  createV2vVmRowsInput({
    inventory: V2V_VMS_INVENTORY,
    importVmsBySourceVmId: new Map([[V2V_DB_VM.id, createV2vImportVm({ isWarm: true, sourceVmId: V2V_DB_VM.id })]]),
    snapshots: [createV2vPartialImportSnapshot({ snapshot_time: SYNC_TIME })],
    listVmIds: new Set([V2V_LISTED_VM.id]),
  })
)

const NOTHING_SELECTED = () => false

const ALL_VMS_VIEW = buildV2vVmsTableView(ROWS, undefined, NOTHING_SELECTED)

// Every VM but the web one is on the datastore B
const DATASTORE_VIEW = buildV2vVmsTableView(ROWS.slice(1), V2V_DATASTORE_B, NOTHING_SELECTED)

function createSelection(overrides: Partial<V2vVmsTableSelection> = {}): V2vVmsTableSelection {
  return { bindings: createTableSelectionBindings(), pageModel: ref(false), toggle: vi.fn(), ...overrides }
}

function mountTable(props: Partial<ComponentProps<typeof V2vVmsTable>> = {}) {
  return mount(V2vVmsTable, {
    props: { view: ALL_VMS_VIEW, selection: createSelection(), ...props },
    global: createGlobalTestConfig(),
  })
}

function mountDatastoreTable() {
  return mountTable({ view: DATASTORE_VIEW })
}

type TableWrapper = ReturnType<typeof mountTable>

function isChecked(checkbox: Pick<DOMWrapper<Element>, 'element'>) {
  return (checkbox.element as HTMLInputElement).checked
}

function findCheckboxes(wrapper: TableWrapper) {
  return findTableColumnCells(wrapper, '').map(cell => cell.get('input'))
}

function findTagAccents(wrapper: TableWrapper) {
  return findTableColumnCells(wrapper, t('migration')).map(cell => cell.getComponent(UiTag).props('accent'))
}

const LISTED_VM_LABEL = `${V2V_LISTED_VM.name}${t('in-list')}`

// What each view shows of the VMs it lists: all of them, or those of the datastore B (all but the web one)
const VIEWS = [
  {
    label: 'all VMs',
    mountView: mountTable,
    names: [V2V_WEB_VM.name, V2V_DB_VM.name, V2V_RDM_VM.name, LISTED_VM_LABEL],
    statuses: [t('not-migrated'), t('v2v:status:warm'), t('v2v:unsupported-rdm-disk'), t('not-migrated')],
    accents: ['neutral', 'info', 'danger', 'neutral'],
  },
  {
    label: 'a datastore',
    mountView: mountDatastoreTable,
    names: [V2V_DB_VM.name, V2V_RDM_VM.name, LISTED_VM_LABEL],
    statuses: [t('v2v:status:warm'), t('v2v:unsupported-rdm-disk'), t('not-migrated')],
    accents: ['info', 'danger', 'neutral'],
  },
]

describe('all VMs', () => {
  it('shows the columns of every VM', () => {
    expect(findTableHeaders(mountTable())).toEqual([
      '',
      t('vm'),
      t('power-state'),
      t('datastores'),
      t('size'),
      t('migration'),
      t('last-sync'),
    ])
  })

  it('shows the power state of each VM', () => {
    expect(findTableColumn(mountTable(), t('power-state'))).toEqual([
      t('vm:status:running'),
      t('vm:status:running'),
      t('vm:status:halted'),
      t('vm:status:suspended'),
    ])
  })

  it('lists the datastores of each VM', () => {
    expect(
      findTableColumnCells(mountTable(), t('datastores')).map(cell =>
        cell.findAll('button').map(button => button.text())
      )
    ).toEqual([['ds-a'], ['ds-a', 'ds-b'], ['ds-b'], ['ds-b']])
  })

  it('filters by the datastore clicked', async () => {
    const wrapper = mountTable()
    const dbVmIndex = ROWS.findIndex(row => row.id === V2V_DB_VM.id)

    await getButtonByLabel(findTableColumnCells(wrapper, t('datastores'))[dbVmIndex], 'ds-b').trigger('click')

    expect(wrapper.emitted('filterDatastore')).toEqual([['ds-b']])
  })

  it('sizes each VM with all its disks', () => {
    expect(findTableColumn(mountTable(), t('size'))).toEqual(['80GiB', '120GiB', '40GiB', '60GiB'])
  })

  it('dates the last sync of a VM synced, and leaves the others empty', () => {
    expect(findTableColumn(mountTable(), t('last-sync'))).toEqual([
      '',
      d(SYNC_TIME * 1000, { dateStyle: 'short', timeStyle: 'medium' }),
      '',
      '',
    ])
  })
})

describe('datastore', () => {
  it('shows the columns of a datastore', () => {
    expect(findTableHeaders(mountDatastoreTable())).toEqual([
      '',
      t('vm'),
      t('also-on'),
      t('size-on-this-datastore'),
      t('migration'),
    ])
  })

  it('lists the other datastores of each VM, none for the VMs on that datastore only', () => {
    expect(findTableColumn(mountDatastoreTable(), t('also-on'))).toEqual(['ds-a', '', ''])
  })

  it('sizes each VM with its disks on that datastore only', () => {
    expect(findTableColumn(mountDatastoreTable(), t('size-on-this-datastore'))).toEqual(['20GiB', '40GiB', '60GiB'])
  })
})

describe('every view', () => {
  it.each(VIEWS)('names each VM and tags the ones already in the list, for $label', ({ mountView, names }) => {
    expect(findTableColumn(mountView(), t('vm'))).toEqual(names)
  })

  it.each(VIEWS)(
    'tags the migration status of each VM, an unsupported one with its reason, for $label',
    ({ mountView, statuses, accents }) => {
      const wrapper = mountView()

      expect(findTableColumn(wrapper, t('migration'))).toEqual(statuses)
      expect(findTagAccents(wrapper)).toEqual(accents)
    }
  )

  it.each(VIEWS)('disables the checkbox of an unsupported VM and of a VM in the list, for $label', ({ mountView }) => {
    const wrapper = mountView()
    const checkboxes = findCheckboxes(wrapper)
    const disabledNames = findTableColumn(wrapper, t('vm')).filter(
      (_name, index) => checkboxes[index].attributes('disabled') !== undefined
    )

    expect(disabledNames).toEqual([V2V_RDM_VM.name, LISTED_VM_LABEL])
  })
})

describe('selection', () => {
  it('checks and highlights the selected VMs', () => {
    const wrapper = mountTable({ view: buildV2vVmsTableView(ROWS, undefined, id => id === V2V_DB_VM.id) })

    expect(findCheckboxes(wrapper).map(isChecked)).toEqual([false, true, false, false])
    expect(findTableRows(wrapper).map(row => row.classes('selected'))).toEqual([false, true, false, false])
  })

  it('toggles the VM checked', async () => {
    const selection = createSelection()
    const wrapper = mountTable({ selection })

    await findCheckboxes(wrapper)[0].setValue(true)

    expect(selection.toggle).toHaveBeenCalledExactlyOnceWith(V2V_WEB_VM.id)
  })

  it('checks the header checkbox when the page is selected', () => {
    const wrapper = mountTable({ selection: createSelection({ pageModel: ref(true) }) })

    expect(isChecked(wrapper.get('thead input'))).toBe(true)
  })

  it('selects the page from the header checkbox', async () => {
    const selection = createSelection()
    const wrapper = mountTable({ selection })

    await wrapper.get('thead input').setValue(true)

    expect(selection.pageModel.value).toBe(true)
  })

  it('tells the selection with the table controls', () => {
    const selection = createSelection({
      bindings: createTableSelectionBindings({ selectedCount: 2, filteredCount: 3 }),
    })

    expect(mountTable({ selection }).getComponent(UiTableSelection).props('selectedCount')).toBe(2)
  })
})

describe('state', () => {
  it('shows a loader while busy', () => {
    const wrapper = mountTable({ state: { type: 'busy' } })

    expect(wrapper.find('.ui-loader').exists()).toBe(true)
    expect(wrapper.find('tbody').exists()).toBe(false)
  })

  it('tells why there is no VM', () => {
    const wrapper = mountTable({
      view: { type: 'all', rows: [] },
      state: { type: 'no-data', message: t('no-vm-detected') },
    })

    expect(wrapper.get('.vts-state-hero').text()).toContain(t('no-vm-detected'))
  })
})
