import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { type FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import {
  type FrontXoVdiSnapshot,
  useXoVdiSnapshotCollection,
} from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import type { Vdi, Vif } from '@/modules/vm/types/new-xo-vm.type.ts'
import { bytesToGiB, generateRandomString } from '@/modules/vm/utils/new-vm.util.ts'
import type { XoSr } from '@vates/types'
import { uniqueId } from 'lodash-es'

export function useNewVmTemplateDevices() {
  const { getNetworkById } = useXoNetworkCollection()
  const { getVbdById } = useXoVbdCollection()
  const { getVdiById } = useXoVdiCollection()
  const { getVdiSnapshotById } = useXoVdiSnapshotCollection()
  const { getVifById } = useXoVifCollection()

  function getTemplateNewVdis(template: FrontXoVmTemplate, defaultSr: XoSr['id'] | undefined): Vdi[] {
    return (template.template_info?.disks ?? []).map((disk, index) => ({
      key: uniqueId('new-vdi-'),
      name_label: `${template.name_label || 'disk'}_${index}_${generateRandomString(4)}`,
      name_description: 'Created by XO',
      size: bytesToGiB(disk.size),
      sr: defaultSr,
    }))
  }

  function getTemplateExistingVdis(template: FrontXoVmTemplate): Vdi[] {
    return template.$VBDs.reduce<Vdi[]>((acc, vbdId) => {
      const vbd = getVbdById(vbdId)

      if (vbd === undefined || vbd.is_cd_drive) {
        return acc
      }

      const vdi = getVdiById(vbd.VDI as FrontXoVdi['id']) ?? getVdiSnapshotById(vbd.VDI as FrontXoVdiSnapshot['id'])

      if (vdi === undefined) {
        console.error('VDI not found')
        return acc
      }

      acc.push({
        key: vdi.id,
        id: vdi.id,
        name_label: vdi.name_label,
        name_description: vdi.name_description,
        size: bytesToGiB(vdi.size),
        sr: vdi.$SR,
        userdevice: vbd.position,
      })

      return acc
    }, [])
  }

  function getTemplateExistingVifs(template: FrontXoVmTemplate): Vif[] {
    return template.VIFs.reduce<Vif[]>((acc, vifId) => {
      const vif = getVifById(vifId)

      if (vif === undefined) {
        console.error('VIF not found')
        return acc
      }

      const network = getNetworkById(vif.$network)

      if (network === undefined) {
        console.error('Network not found')
        return acc
      }

      acc.push({
        key: vif.id,
        id: vif.id,
        network: network.id,
        mac: '',
        device: vif.device,
      })

      return acc
    }, []).sort((vif1, vif2) => {
      if (!vif1.device || !vif2.device) {
        return 0
      }

      return vif1.device.localeCompare(vif2.device)
    })
  }

  return {
    getTemplateNewVdis,
    getTemplateExistingVdis,
    getTemplateExistingVifs,
  }
}
