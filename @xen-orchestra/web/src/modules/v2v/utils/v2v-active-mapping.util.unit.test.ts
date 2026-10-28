import { getV2vActiveMapping } from '@/modules/v2v/utils/v2v-active-mapping.util.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVif } from '@/test/create-vif.ts'
import {
  V2V_DATA_DISK,
  V2V_DEFAULT_NETWORK,
  V2V_LAN_NIC,
  V2V_MAPPED_VM,
  V2V_SSD_SR,
  V2V_SYSTEM_DISK,
  V2V_VLAN_NETWORK,
  V2V_VLAN_NIC,
} from '@/test/v2v-mapping-fixtures.ts'
import { V2V_VDI_OTHER_CONFIG } from '@vates/types'

const [BASE_PATH, SNAPSHOT_PATH] = V2V_SYSTEM_DISK.chainPaths

function createImportedVdi(otherConfig: Record<string, string>) {
  return createVdi({ $SR: V2V_SSD_SR.id, other_config: otherConfig })
}

function getDiskMapping(otherConfig: Record<string, string>) {
  const vdi = createImportedVdi(otherConfig)

  return getV2vActiveMapping(V2V_MAPPED_VM, [vdi], [createVbd({ VDI: vdi.id })], []).disks
}

function getNicMapping(vifs: FrontXoVif[]) {
  return getV2vActiveMapping(V2V_MAPPED_VM, [], [], vifs).nics
}

describe('getV2vActiveMapping', () => {
  it.each([
    ['the base disk', BASE_PATH],
    ['a snapshot delta', SNAPSHOT_PATH],
  ])('maps a disk to the SR of the VDI that last received %s of its chain', (_, diskPath) => {
    expect(getDiskMapping({ [V2V_VDI_OTHER_CONFIG.DISK_PATH]: diskPath })[0]).toEqual({
      disk: V2V_SYSTEM_DISK,
      srId: V2V_SSD_SR.id,
    })
  })

  it.each([
    ['a VDI of a legacy import, without disk path', { esxi_uuid: 'b4cf9e4e' }],
    ['a VDI of another disk', { [V2V_VDI_OTHER_CONFIG.DISK_PATH]: V2V_DATA_DISK.chainPaths[0] }],
  ])('leaves a disk unpaired with %s', (_, otherConfig) => {
    expect(getDiskMapping(otherConfig)[0]).toEqual({ disk: V2V_SYSTEM_DISK, srId: undefined })
  })

  it('leaves a disk unpaired with a VDI the import VM does not hold', () => {
    const vdi = createImportedVdi({ [V2V_VDI_OTHER_CONFIG.DISK_PATH]: BASE_PATH })

    expect(getV2vActiveMapping(V2V_MAPPED_VM, [vdi], [], []).disks[0]).toEqual({
      disk: V2V_SYSTEM_DISK,
      srId: undefined,
    })
  })

  it('lists every disk of the source, in its order, paired or not', () => {
    expect(getDiskMapping({ [V2V_VDI_OTHER_CONFIG.DISK_PATH]: BASE_PATH })).toEqual([
      { disk: V2V_SYSTEM_DISK, srId: V2V_SSD_SR.id },
      { disk: V2V_DATA_DISK, srId: undefined },
    ])
  })

  it('maps each NIC to the network of the VIF of its device, created in the NIC order', () => {
    const vifs = [
      createVif({ device: '1', $network: V2V_VLAN_NETWORK.id, MAC: V2V_VLAN_NIC.macAddress }),
      createVif({ device: '0', $network: V2V_DEFAULT_NETWORK.id, MAC: V2V_LAN_NIC.macAddress }),
    ]

    expect(getNicMapping(vifs)).toEqual([
      { nic: V2V_LAN_NIC, networkId: V2V_DEFAULT_NETWORK.id, isMacKept: true },
      { nic: V2V_VLAN_NIC, networkId: V2V_VLAN_NETWORK.id, isMacKept: true },
    ])
  })

  it.each([
    ['kept, whatever its case', V2V_LAN_NIC.macAddress.toUpperCase(), true],
    ['changed', 'aa:bb:cc:dd:ee:ff', false],
  ])('tells the MAC of a NIC %s', (_, mac, isMacKept) => {
    const vifs = [createVif({ device: '0', MAC: mac })]

    expect(getNicMapping(vifs)[0].isMacKept).toBe(isMacKept)
  })

  it('leaves a NIC without VIF unpaired', () => {
    expect(getNicMapping([])).toEqual([
      { nic: V2V_LAN_NIC, networkId: undefined, isMacKept: false },
      { nic: V2V_VLAN_NIC, networkId: undefined, isMacKept: false },
    ])
  })
})
