import V2vActiveMappingCard from '@/modules/v2v/components/mapping/V2vActiveMappingCard.vue'
import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { findAccentedInfos } from '@/test/find-accented-labels.ts'
import { findParts } from '@/test/find-parts.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { describeV2vMappingCardLayout } from '@/test/v2v-mapping-card.ts'
import { V2V_ACTIVE_DISK_ROWS, V2V_ACTIVE_NIC_ROWS } from '@/test/v2v-mapping-fixtures.ts'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { mount, type VueWrapper } from '@vue/test-utils'

function mountCard({ diskRows = V2V_ACTIVE_DISK_ROWS, nicRows = V2V_ACTIVE_NIC_ROWS, loading = false } = {}) {
  return mount(V2vActiveMappingCard, {
    props: { poolName: DISKOR_POOL_NAME, diskRows, nicRows, loading },
    global: createGlobalTestConfig(),
  })
}

describeV2vMappingCardLayout({ mountCard, title: t('active-mapping') })

// Each device: its source parts as its key, its destination as its value
function findDevices(wrapper: VueWrapper) {
  return wrapper.findAll('.v2v-mapping-card-section .vts-card-row-key-value').map(row => ({
    sourceParts: findParts(row, '.key .inline-parts'),
    destination: row.get('.value').text(),
  }))
}

it('shows its title, locked', () => {
  const title = mountCard().getComponent(UiPanelCardTitle)

  expect([title.props('label'), title.props('icon')]).toEqual([t('active-mapping'), 'fa:lock'])
})

it('tells the mapping is locked since the first sync', () => {
  expect(findAccentedInfos(mountCard())).toEqual([{ label: t('v2v:locked-since-first-sync'), accent: 'info' }])
})

it('names the pool the VM was synced to', () => {
  expect(findCardLabelledValues(mountCard())[t('pool')]).toBe(DISKOR_POOL_NAME)
})

it('shows each source device with its details, then its destination, empty for an unpaired one', () => {
  expect(findDevices(mountCard())).toEqual(
    [...V2V_ACTIVE_DISK_ROWS, ...V2V_ACTIVE_NIC_ROWS].map(row => ({
      sourceParts: row.sourceParts,
      destination: row.destination ?? '',
    }))
  )
})
