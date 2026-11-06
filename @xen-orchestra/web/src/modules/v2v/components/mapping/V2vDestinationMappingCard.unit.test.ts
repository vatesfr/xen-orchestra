import V2vDestinationMappingCard from '@/modules/v2v/components/mapping/V2vDestinationMappingCard.vue'
import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { findAllGenericComponents } from '@/test/find-generic-components.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { describeV2vMappingCardLayout } from '@/test/v2v-mapping-card.ts'
import { V2V_DISK_ROWS, V2V_NIC_ROWS, V2V_TARGET_OPTIONS } from '@/test/v2v-mapping-fixtures.ts'
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

describeV2vMappingCardLayout({ mountCard, title: t('destination') })

function findTargetValues(wrapper: VueWrapper) {
  return findAllGenericComponents(wrapper, 'V2vTargetValue').map(value => value.props())
}

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
