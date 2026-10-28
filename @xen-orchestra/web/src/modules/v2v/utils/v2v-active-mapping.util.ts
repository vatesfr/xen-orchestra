import type { V2vActiveMapping } from '@/modules/v2v/types/v2v-mapping.type.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { V2V_VDI_OTHER_CONFIG, type XoV2vVm } from '@vates/types'

// MAC addresses are case-insensitive
function isSameMac(firstMac: string, secondMac: string) {
  return firstMac.toLowerCase() === secondMac.toLowerCase()
}

// Same pairing as the import (`diskIsAlreadyImported`): a VDI records the path of the last disk of the chain it
// received. A legacy VDI records only a CID, which the inventory does not expose: it stays unpaired. The import creates
// the VIFs of a new VM in the order of its NICs, on its first free devices: `0`, `1`…
export function getV2vActiveMapping(
  vm: Pick<XoV2vVm, 'disks' | 'nics'>,
  vdis: Pick<FrontXoVdi, 'id' | '$SR' | 'other_config'>[],
  importVmVbds: Pick<FrontXoVbd, 'VDI'>[],
  importVmVifs: Pick<FrontXoVif, 'device' | '$network' | 'MAC'>[]
): V2vActiveMapping {
  const importVmVdiIds = new Set(importVmVbds.map(vbd => vbd.VDI))

  const importVmVdis = vdis.filter(vdi => importVmVdiIds.has(vdi.id))

  return {
    disks: vm.disks.map(disk => ({
      disk,
      srId: importVmVdis.find(vdi => disk.chainPaths.includes(vdi.other_config[V2V_VDI_OTHER_CONFIG.DISK_PATH]))?.$SR,
    })),
    nics: vm.nics.map((nic, index) => {
      const vif = importVmVifs.find(importVmVif => importVmVif.device === String(index))

      return {
        nic,
        networkId: vif?.$network,
        isMacKept: vif !== undefined && isSameMac(vif.MAC, nic.macAddress),
      }
    }),
  }
}
