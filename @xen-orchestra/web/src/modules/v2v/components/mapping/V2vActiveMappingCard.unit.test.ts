import V2vActiveMappingCard from '@/modules/v2v/components/mapping/V2vActiveMappingCard.vue'
import type { V2vActiveMappingRow } from '@/modules/v2v/types/v2v-mapping.type.ts'
import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { findAccentedInfos } from '@/test/find-accented-labels.ts'
import { findPanelCardTitles } from '@/test/find-card-title.ts'
import { findParts } from '@/test/find-parts.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { V2V_ACTIVE_DISK_ROWS, V2V_ACTIVE_NIC_ROWS } from '@/test/v2v-mapping-fixtures.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { mount, type VueWrapper } from '@vue/test-utils'

function mountCard({ diskRows = V2V_ACTIVE_DISK_ROWS, nicRows = V2V_ACTIVE_NIC_ROWS, loading = false } = {}) {
  return mount(V2vActiveMappingCard, {
    props: { poolName: DISKOR_POOL_NAME, diskRows, nicRows, loading },
    global: createGlobalTestConfig(),
  })
}

function countDividers(wrapper: VueWrapper) {
  return wrapper.findAllComponents(VtsDivider).length
}

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

it('titles the disks and the network adapters, each set apart', () => {
  const wrapper = mountCard()

  expect([findPanelCardTitles(wrapper), countDividers(wrapper)]).toEqual([
    [t('active-mapping'), t('disks'), t('network-adapters')],
    2,
  ])
})

it('shows each source device with its details, then its destination, empty for an unpaired one', () => {
  expect(findDevices(mountCard())).toEqual(
    [...V2V_ACTIVE_DISK_ROWS, ...V2V_ACTIVE_NIC_ROWS].map(row => ({
      sourceParts: row.sourceParts,
      destination: row.destination ?? '',
    }))
  )
})

it.each([
  ['disks', { diskRows: [] as V2vActiveMappingRow[] }, [t('active-mapping'), t('network-adapters')]],
  ['network adapters', { nicRows: [] as V2vActiveMappingRow[] }, [t('active-mapping'), t('disks')]],
])('leaves out the %s of a VM without any, and their divider', (_, rows, titles) => {
  const wrapper = mountCard(rows)

  expect([findPanelCardTitles(wrapper), countDividers(wrapper)]).toEqual([titles, 1])
})

it('shows the devices busy, the pool alone, while loading', () => {
  const wrapper = mountCard({ loading: true })

  expect(wrapper.getComponent(VtsStateHero).props('type')).toBe('busy')
  expect([findPanelCardTitles(wrapper), findCardLabelledValues(wrapper), countDividers(wrapper)]).toEqual([
    [t('active-mapping')],
    { [t('pool')]: DISKOR_POOL_NAME },
    1,
  ])
})
