import V2vActiveMappingCard from '@/modules/v2v/components/mapping/V2vActiveMappingCard.vue'
import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { findCardTitleLabel } from '@/test/find-card-title.ts'
import { findParts } from '@/test/find-parts.ts'
import { findTableColumn, findTableColumnCells, findTableHeaders } from '@/test/find-table-cells.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { V2V_ACTIVE_MAPPING_ROWS } from '@/test/v2v-mapping-fixtures.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { mount } from '@vue/test-utils'

function mountCard(loading = false) {
  return mount(V2vActiveMappingCard, {
    props: { poolName: DISKOR_POOL_NAME, rows: V2V_ACTIVE_MAPPING_ROWS, loading },
    global: createGlobalTestConfig(),
  })
}

it('shows its title, locked', () => {
  const wrapper = mountCard()

  expect([findCardTitleLabel(wrapper), wrapper.getComponent(VtsIcon).props('name')]).toEqual([
    t('active-mapping'),
    'fa:lock',
  ])
})

it('tells the mapping is locked on its pool since the first sync', () => {
  expect(findParts(mountCard(), '.ui-card-title .inline-parts')).toEqual([
    t('v2v:locked-since-first-sync'),
    t('pool-named', { name: DISKOR_POOL_NAME }),
  ])
})

it('shows the source, its detail and its destination, in this order', () => {
  expect(findTableHeaders(mountCard())).toEqual([t('source'), t('details'), t('destination')])
})

it('names each source device and its destination, empty for an unpaired one', () => {
  const wrapper = mountCard()

  expect([findTableColumn(wrapper, t('source')), findTableColumn(wrapper, t('destination'))]).toEqual([
    ['Hard disk 1', 'Hard disk 2', 'Network adapter 1', 'Network adapter 2'],
    ['sr-ssd-01', '', 'VLAN 10', 'VLAN 20'],
  ])
})

it('lays out the detail of each source device', () => {
  const cells = findTableColumnCells(mountCard(), t('details'))

  expect(cells.map(cell => findParts(cell, '.inline-parts'))).toEqual(
    V2V_ACTIVE_MAPPING_ROWS.map(row => row.detailParts)
  )
})

it.each([
  [true, 'busy'],
  [false, undefined],
])('shows the table busy while loading is %s', (loading, stateType) => {
  expect(mountCard(loading).getComponent(VtsTable).props('state')?.type).toBe(stateType)
})
