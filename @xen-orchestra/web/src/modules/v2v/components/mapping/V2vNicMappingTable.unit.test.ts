import V2vNicMappingTable from '@/modules/v2v/components/mapping/V2vNicMappingTable.vue'
import { findParts } from '@/test/find-parts.ts'
import { findTableColumn, findTableColumnCells, findTableHeaders } from '@/test/find-table-cells.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { V2V_NIC_ROWS, V2V_TARGET_OPTIONS } from '@/test/v2v-mapping-fixtures.ts'
import { describeV2vTargetCells } from '@/test/v2v-target-cells.ts'
import { mount } from '@vue/test-utils'

function mountTable() {
  return mount(V2vNicMappingTable, {
    props: { rows: V2V_NIC_ROWS, networkOptions: V2V_TARGET_OPTIONS.networks, loading: true },
    global: createGlobalTestConfig(),
  })
}

it('shows the adapter, its port group, its MAC address, its target network and where it comes from, in this order', () => {
  expect(findTableHeaders(mountTable())).toEqual([
    t('adapter'),
    t('port-group'),
    t('mac-address'),
    t('target-network'),
    t('value-from'),
  ])
})

it('names each adapter with its MAC address', () => {
  const wrapper = mountTable()

  expect([findTableColumn(wrapper, t('adapter')), findTableColumn(wrapper, t('mac-address'))]).toEqual([
    ['Network adapter 1', 'Network adapter 2'],
    ['00:50:56:ab:cd:01', '00:50:56:00:00:02'],
  ])
})

it('lays out the port group of each adapter, empty without one', () => {
  const cells = findTableColumnCells(mountTable(), t('port-group'))

  expect(cells.map(cell => findParts(cell, '.inline-parts'))).toEqual(V2V_NIC_ROWS.map(row => row.portGroupParts))
})

describeV2vTargetCells({
  mountTable,
  targetHeader: t('target-network'),
  changeEvent: 'changeNetwork',
  rows: V2V_NIC_ROWS.map(({ key, network }) => ({ key, target: network })),
  options: V2V_TARGET_OPTIONS.networks,
})
