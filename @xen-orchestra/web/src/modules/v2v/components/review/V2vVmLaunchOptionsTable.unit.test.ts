import V2vLaunchOptionSelect from '@/modules/v2v/components/review/V2vLaunchOptionSelect.vue'
import V2vVmLaunchOptionsTable from '@/modules/v2v/components/review/V2vVmLaunchOptionsTable.vue'
import { createV2vVmLaunchOptionsRow } from '@/test/create-v2v-launch.ts'
import { findCardTitle } from '@/test/find-card-title.ts'
import { findTableColumn, findTableColumnCells, findTableHeaders } from '@/test/find-table-cells.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { XoV2vVm } from '@vates/types'
import { mount } from '@vue/test-utils'

const DEFAULT_ROW = createV2vVmLaunchOptionsRow()

const OVERRIDDEN_ROW = createV2vVmLaunchOptionsRow({
  id: 'vm-2' as XoV2vVm['id'],
  name: 'db-01',
  overrides: { stopSource: false, repair: true },
})

const ROWS = [DEFAULT_ROW, OVERRIDDEN_ROW]

function mountTable() {
  return mount(V2vVmLaunchOptionsTable, {
    props: { rows: ROWS, defaults: { stopSource: true, repair: false, startVm: false } },
    global: createGlobalTestConfig(),
  })
}

function findOptionSelects(wrapper: ReturnType<typeof mountTable>, header: string) {
  return findTableColumnCells(wrapper, header).map(cell => cell.getComponent(V2vLaunchOptionSelect))
}

it('shows its title and that "Default" follows the default options', () => {
  expect(findCardTitle(mountTable())).toBe(`${t('per-vm-options')} ${t('v2v:per-vm-options-info')}`)
})

it('shows the VM, then whether to stop its source, to repair it, and to start it, in this order', () => {
  expect(findTableHeaders(mountTable())).toEqual([
    t('vm'),
    t('v2v:stop-source'),
    t('v2v:repair'),
    t('v2v:start-on-xcp-ng'),
  ])
})

it('names each VM, in the given order', () => {
  expect(findTableColumn(mountTable(), t('vm'))).toEqual(['web-01', 'db-01'])
})

it.each([
  ['stops its source', 'v2v:stop-source', true, false],
  ['is repaired', 'v2v:repair', false, true],
  ['is started', 'v2v:start-on-xcp-ng', false, undefined],
] as const)('shows whether each VM %s, or follows the default', (_, headerKey, defaultValue, override) => {
  expect(findOptionSelects(mountTable(), t(headerKey)).map(select => select.props())).toEqual([
    { modelValue: undefined, defaultValue },
    { modelValue: override, defaultValue },
  ])
})

it.each([
  ['a value', 'v2v:stop-source', 'stopSource', 0, false],
  ['the default', 'v2v:stop-source', 'stopSource', 1, undefined],
  ['a value', 'v2v:repair', 'repair', 0, true],
  ['a value', 'v2v:start-on-xcp-ng', 'startVm', 1, true],
] as const)('emits the VM, the option and %s picked in the %s column', (_, headerKey, option, rowIndex, value) => {
  const wrapper = mountTable()

  findOptionSelects(wrapper, t(headerKey))[rowIndex].vm.$emit('update:modelValue', value)

  expect(wrapper.emitted('changeOption')).toEqual([[ROWS[rowIndex].id, option, value]])
})
