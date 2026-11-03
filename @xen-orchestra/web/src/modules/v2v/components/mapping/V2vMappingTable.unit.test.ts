import V2vMappingTable from '@/modules/v2v/components/mapping/V2vMappingTable.vue'
import V2vVmKindActions from '@/modules/v2v/components/panel/V2vVmKindActions.vue'
import type { V2vMappingStepRow } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import {
  createV2vMappingStepRow,
  createV2vNewMappingStepVm,
  createV2vNotFoundMappingStepVm,
  createV2vResumedMappingStepVm,
} from '@/test/create-v2v-mapping-step-vm.ts'
import { findAccentedInfos, findAccentedTags } from '@/test/find-accented-labels.ts'
import { findParts } from '@/test/find-parts.ts'
import { findTableColumn, findTableColumnCells, findTableHeaders } from '@/test/find-table-cells.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { v2vVmActionsMock } from '@/test/mock-v2v-vm-actions.ts'
import { getV2vVmKindActionList } from '@/test/v2v-vm-kind-actions.ts'
import VtsActionItems from '@core/components/menu/VtsActionItems.vue'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import VtsActionCell from '@core/components/table/cells/VtsActionCell.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import type { XoV2vVm } from '@vates/types'
import { mount, type VueWrapper } from '@vue/test-utils'

vi.mock(
  import('@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'),
  () => import('@/test/mock-v2v-vm-actions.ts')
)

beforeEach(() => {
  v2vVmActionsMock.reset()
})

const NEW_VM = createV2vNewMappingStepVm()

// The synced VM is the mapped one, resumed: its row needs an id of its own
const RESUMED_VM = createV2vResumedMappingStepVm({ id: 'vm-resumed' as XoV2vVm['id'] })

const NOT_FOUND_VM = createV2vNotFoundMappingStepVm()

// The item labels are the table input: read back as given
const ROWS: V2vMappingStepRow[] = [
  createV2vMappingStepRow(NEW_VM, {
    kind: { label: 'New', accent: 'neutral' },
    mappingParts: ['2 disks → sr-a', '1 NIC → net'],
    check: { label: 'Mapping incomplete', accent: 'danger' },
  }),
  createV2vMappingStepRow(RESUMED_VM, {
    kind: { label: 'Resume', accent: 'info' },
    mappingParts: ['Delta from last sync', 'mapping locked'],
    check: { label: 'Ready', accent: 'success' },
    isSelected: true,
  }),
  createV2vMappingStepRow(NOT_FOUND_VM, {
    kind: undefined,
    mappingParts: [],
    check: { label: 'Not found in the source', accent: 'danger' },
  }),
]

const updateVm = vi.fn()

function mountTable(rows = ROWS) {
  return mount(V2vMappingTable, { props: { rows, updateVm }, global: createGlobalTestConfig() })
}

function getActionCell(wrapper: VueWrapper, rowIndex: number) {
  return wrapper.findAllComponents(VtsActionCell)[rowIndex]
}

// The menu of a row renders its items once opened
async function openRowMenu(wrapper: VueWrapper, rowIndex: number) {
  await getActionCell(wrapper, rowIndex).getComponent(VtsActionsMenu).getComponent(UiButtonIcon).trigger('click')

  return wrapper.getComponent(VtsActionItems)
}

it('heads the columns of the VMs of the list', () => {
  expect(findTableHeaders(mountTable())).toEqual([t('vm'), t('type'), t('mapping'), t('checks'), ''])
})

it('lists the VMs in the given order, by name', () => {
  expect(findTableColumn(mountTable(), t('vm'))).toEqual([
    NEW_VM.heading.name,
    RESUMED_VM.heading.name,
    NOT_FOUND_VM.heading.name,
  ])
})

it('tags each VM with its kind, none for a VM not found in the source, and tells its check, accented', () => {
  const wrapper = mountTable()

  expect(findAccentedTags(wrapper)).toEqual([ROWS[0].item.kind, ROWS[1].item.kind])
  expect(findAccentedInfos(wrapper)).toEqual(ROWS.map(row => row.item.check))
})

it('sums the mapping of each VM up in parts, none for a VM without', () => {
  const mappingCells = findTableColumnCells(mountTable(), t('mapping'))

  expect(mappingCells.map(cell => findParts(cell, '.inline-parts'))).toEqual(ROWS.map(row => row.item.mappingParts))
})

it('marks the row of the selected VM alone', () => {
  expect(
    mountTable()
      .findAllComponents(VtsRow)
      .map(row => row.props('selected'))
  ).toEqual([false, true, false])
})

it('pages the VMs', () => {
  expect(mountTable().getComponent(VtsTable).props('paginationBindings')?.total).toBe(ROWS.length)
})

it('tells an empty list', () => {
  expect(mountTable([]).getComponent(VtsTable).props('state')?.message).toBe(t('v2v:no-vm-in-list'))
})

it('emits the selection of the VM of a row from its eye', async () => {
  const wrapper = mountTable()

  await getActionCell(wrapper, 1).getComponent(UiButtonIcon).trigger('click')

  expect(wrapper.emitted('select')).toEqual([[RESUMED_VM.id]])
})

describe('row menu', () => {
  it.each([
    ['a new VM', 0, v2vVmActionsMock.useV2vNewVmActions],
    ['a resumed VM', 1, v2vVmActionsMock.useV2vResumedVmActions],
  ] as const)('leads with the settings edit of %s, the other actions set apart', async (_, rowIndex, useActions) => {
    const wrapper = mountTable()
    const items = await openRowMenu(wrapper, rowIndex)
    const { mainAction, moreActions } = getV2vVmKindActionList(useActions)

    expect(items.props('actions')).toEqual([mainAction, { ...moreActions[0], separator: true }])
  })

  it('offers the actions of a VM not found in the source, without separator', async () => {
    const items = await openRowMenu(mountTable(), 2)

    expect(items.props('actions')).toEqual(getV2vVmKindActionList(v2vVmActionsMock.useV2vNotFoundVmActions).moreActions)
  })

  it('runs the actions of the VM of the row, stored through the list', async () => {
    const wrapper = mountTable()

    await openRowMenu(wrapper, 0)

    expect(wrapper.getComponent(V2vVmKindActions).props()).toEqual({ vm: NEW_VM, updateVm })
  })

  it('emits the removal of the VM of a row, for the step to confirm it', async () => {
    const wrapper = mountTable()

    await openRowMenu(wrapper, 2)
    v2vVmActionsMock.useV2vNotFoundVmActions.mock.lastCall?.[1].remove(NOT_FOUND_VM.id)

    expect(wrapper.emitted('remove')).toEqual([[NOT_FOUND_VM.id]])
  })
})
