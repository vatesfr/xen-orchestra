import V2vDestinationMappingCard from '@/modules/v2v/components/mapping/V2vDestinationMappingCard.vue'
import V2vDiskMappingTable from '@/modules/v2v/components/mapping/V2vDiskMappingTable.vue'
import V2vNicMappingTable from '@/modules/v2v/components/mapping/V2vNicMappingTable.vue'
import type { V2vDiskMappingRow, V2vNicMappingRow } from '@/modules/v2v/types/v2v-mapping.type.ts'
import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { findCardTitle } from '@/test/find-card-title.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import {
  V2V_DATA_DISK,
  V2V_DISK_ROWS,
  V2V_LAN_NIC,
  V2V_NIC_ROWS,
  V2V_SSD_SR,
  V2V_TARGET_OPTIONS,
  V2V_VLAN_NETWORK,
} from '@/test/v2v-mapping-fixtures.ts'
import { mount } from '@vue/test-utils'

function mountCard({ diskRows = V2V_DISK_ROWS, nicRows = V2V_NIC_ROWS } = {}) {
  return mount(V2vDestinationMappingCard, {
    props: {
      poolName: DISKOR_POOL_NAME,
      diskRows,
      nicRows,
      srOptions: V2V_TARGET_OPTIONS.srs,
      networkOptions: V2V_TARGET_OPTIONS.networks,
      loading: true,
    },
    global: createGlobalTestConfig(),
  })
}

function findSubtitles(wrapper: ReturnType<typeof mountCard>) {
  return wrapper.findAll('.ui-card-subtitle').map(subtitle => subtitle.text())
}

it('names the pool the list sets', () => {
  expect(findCardTitle(mountCard())).toBe(
    `${t('destination')} ${t('v2v:pool-set-by-list', { pool: DISKOR_POOL_NAME })}`
  )
})

it('maps the disks then the network adapters', () => {
  const wrapper = mountCard()

  expect(findSubtitles(wrapper)).toEqual([t('disks'), t('network-adapters')])
  expect(wrapper.getComponent(V2vDiskMappingTable).props()).toEqual({
    rows: V2V_DISK_ROWS,
    srOptions: V2V_TARGET_OPTIONS.srs,
    loading: true,
  })
  expect(wrapper.getComponent(V2vNicMappingTable).props()).toEqual({
    rows: V2V_NIC_ROWS,
    networkOptions: V2V_TARGET_OPTIONS.networks,
    loading: true,
  })
})

it.each([
  ['disks', { diskRows: [] as V2vDiskMappingRow[] }, [t('network-adapters')]],
  ['network adapters', { nicRows: [] as V2vNicMappingRow[] }, [t('disks')]],
])('leaves out the %s of a VM without any', (_, rows, subtitles) => {
  expect(findSubtitles(mountCard(rows))).toEqual(subtitles)
})

it('passes on the SR chosen for a disk', () => {
  const wrapper = mountCard()

  wrapper.getComponent(V2vDiskMappingTable).vm.$emit('changeSr', V2V_DATA_DISK.key, V2V_SSD_SR.id)

  expect(wrapper.emitted('changeDiskSr')).toEqual([[V2V_DATA_DISK.key, V2V_SSD_SR.id]])
})

it('passes on the network chosen for a NIC', () => {
  const wrapper = mountCard()

  wrapper.getComponent(V2vNicMappingTable).vm.$emit('changeNetwork', V2V_LAN_NIC.key, V2V_VLAN_NETWORK.id)

  expect(wrapper.emitted('changeNicNetwork')).toEqual([[V2V_LAN_NIC.key, V2V_VLAN_NETWORK.id]])
})
