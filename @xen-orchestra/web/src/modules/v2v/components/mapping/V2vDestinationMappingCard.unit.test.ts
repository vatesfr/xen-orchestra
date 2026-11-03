import V2vDestinationMappingCard from '@/modules/v2v/components/mapping/V2vDestinationMappingCard.vue'
import type { V2vDiskMappingRow, V2vNicMappingRow } from '@/modules/v2v/types/v2v-mapping.type.ts'
import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { findPanelCardTitles } from '@/test/find-card-title.ts'
import { findAllGenericComponents } from '@/test/find-generic-components.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { V2V_DISK_ROWS, V2V_NIC_ROWS, V2V_TARGET_OPTIONS } from '@/test/v2v-mapping-fixtures.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { mount, type VueWrapper } from '@vue/test-utils'

function mountCard({ diskRows = V2V_DISK_ROWS, nicRows = V2V_NIC_ROWS, loading = false } = {}) {
  return mount(V2vDestinationMappingCard, {
    props: {
      poolName: DISKOR_POOL_NAME,
      diskRows,
      nicRows,
      srOptions: V2V_TARGET_OPTIONS.srs,
      networkOptions: V2V_TARGET_OPTIONS.networks,
      loading,
    },
    global: createGlobalTestConfig(),
  })
}

function findTargetValues(wrapper: VueWrapper) {
  return findAllGenericComponents(wrapper, 'V2vTargetValue').map(value => value.props())
}

function countDividers(wrapper: VueWrapper) {
  return wrapper.findAllComponents(VtsDivider).length
}

it('titles the destination, then the disks and the network adapters, each set apart', () => {
  const wrapper = mountCard()

  expect([findPanelCardTitles(wrapper), countDividers(wrapper)]).toEqual([
    [t('destination'), t('disks'), t('network-adapters')],
    2,
  ])
})

it('names the pool the list sets, then each disk and each network adapter', () => {
  expect(Object.keys(findCardLabelledValues(mountCard()))).toEqual([
    t('pool'),
    ...V2V_DISK_ROWS.map(row => row.label),
    ...V2V_NIC_ROWS.map(row => row.label),
  ])
  expect(findCardLabelledValues(mountCard())[t('pool')]).toBe(DISKOR_POOL_NAME)
})

it('maps each disk to its SR, then each network adapter to its network', () => {
  expect(findTargetValues(mountCard())).toEqual([
    ...V2V_DISK_ROWS.map(row => ({ target: row.sr, options: V2V_TARGET_OPTIONS.srs })),
    ...V2V_NIC_ROWS.map(row => ({ target: row.network, options: V2V_TARGET_OPTIONS.networks })),
  ])
})

it.each([
  ['disks', { diskRows: [] as V2vDiskMappingRow[] }, [t('destination'), t('network-adapters')]],
  ['network adapters', { nicRows: [] as V2vNicMappingRow[] }, [t('destination'), t('disks')]],
])('leaves out the %s of a VM without any, and their divider', (_, rows, titles) => {
  const wrapper = mountCard(rows)

  expect([findPanelCardTitles(wrapper), countDividers(wrapper)]).toEqual([titles, 1])
})

it('shows the mapping busy, the pool alone, while the pool offers load', () => {
  const wrapper = mountCard({ loading: true })

  expect(wrapper.getComponent(VtsStateHero).props('type')).toBe('busy')
  expect([findPanelCardTitles(wrapper), findCardLabelledValues(wrapper), countDividers(wrapper)]).toEqual([
    [t('destination')],
    { [t('pool')]: DISKOR_POOL_NAME },
    1,
  ])
})
