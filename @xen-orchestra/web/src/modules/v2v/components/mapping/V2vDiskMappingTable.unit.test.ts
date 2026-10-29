import V2vDiskMappingTable from '@/modules/v2v/components/mapping/V2vDiskMappingTable.vue'
import { findTableColumn, findTableHeaders } from '@/test/find-table-cells.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { V2V_DISK_ROWS, V2V_TARGET_OPTIONS } from '@/test/v2v-mapping-fixtures.ts'
import { describeV2vTargetCells } from '@/test/v2v-target-cells.ts'
import { mount } from '@vue/test-utils'

function mountTable() {
  return mount(V2vDiskMappingTable, {
    props: { rows: V2V_DISK_ROWS, srOptions: V2V_TARGET_OPTIONS.srs, loading: true },
    global: createGlobalTestConfig(),
  })
}

it('shows the disk, its datastore, its size, its target SR and where it comes from, in this order', () => {
  expect(findTableHeaders(mountTable())).toEqual([
    t('disk'),
    t('datastore'),
    t('size'),
    t('target-sr'),
    t('value-from'),
  ])
})

it('names each disk and its datastore', () => {
  const wrapper = mountTable()

  expect([findTableColumn(wrapper, t('disk')), findTableColumn(wrapper, t('datastore'))]).toEqual([
    ['Hard disk 1', 'Hard disk 2'],
    ['ds-prod-01', 'ds-prod-01'],
  ])
})

it('shows the size of each disk', () => {
  expect(findTableColumn(mountTable(), t('size'))).toEqual(['80GiB', '80GiB'])
})

describeV2vTargetCells({
  mountTable,
  targetHeader: t('target-sr'),
  changeEvent: 'changeSr',
  rows: V2V_DISK_ROWS.map(({ key, sr }) => ({ key, target: sr })),
  options: V2V_TARGET_OPTIONS.srs,
})
