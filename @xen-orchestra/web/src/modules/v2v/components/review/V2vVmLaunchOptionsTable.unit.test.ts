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
  overrides: { stopSource: false },
})

const ROWS = [DEFAULT_ROW, OVERRIDDEN_ROW]

function mountTable() {
  return mount(V2vVmLaunchOptionsTable, {
    props: { rows: ROWS, defaultStopSource: true },
    global: createGlobalTestConfig(),
  })
}

function findStopSourceSelects(wrapper: ReturnType<typeof mountTable>) {
  return findTableColumnCells(wrapper, t('v2v:stop-source')).map(cell => cell.getComponent(V2vLaunchOptionSelect))
}

it('shows its title and that "Default" follows the default options', () => {
  expect(findCardTitle(mountTable())).toBe(`${t('per-vm-options')} ${t('v2v:per-vm-options-info')}`)
})

it('shows the VM, then whether to stop its source, to start it and to clean it up, in this order', () => {
  expect(findTableHeaders(mountTable())).toEqual([
    t('vm'),
    t('v2v:stop-source'),
    t('v2v:start-on-xcp-ng'),
    t('v2v:clean-up-preview'),
  ])
})

it('names each VM, in the given order', () => {
  expect(findTableColumn(mountTable(), t('vm'))).toEqual(['web-01', 'db-01'])
})

it('shows whether each VM stops its source, or follows the default', () => {
  expect(findStopSourceSelects(mountTable()).map(select => select.props())).toEqual([
    { modelValue: undefined, defaultValue: true },
    { modelValue: false, defaultValue: true },
  ])
})

it.each([
  ['a value', 0, false],
  ['the default', 1, undefined],
])('emits the VM and %s picked to stop its source', (_, rowIndex, value) => {
  const wrapper = mountTable()

  findStopSourceSelects(wrapper)[rowIndex].vm.$emit('update:modelValue', value)

  expect(wrapper.emitted('changeStopSource')).toEqual([[ROWS[rowIndex].id, value]])
})

it.each([t('v2v:start-on-xcp-ng'), t('v2v:clean-up-preview')])('tells %s is not supported yet for any VM', header => {
  expect(findTableColumn(mountTable(), header)).toEqual([t('not-supported-yet'), t('not-supported-yet')])
})
