import { getV2vActiveMapping } from '@/modules/v2v/utils/v2v-active-mapping.util.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { XoV2vVm } from '@vates/types'
import { computed } from 'vue'

// The targets of the first sync of a VMware VM, read back from the devices of its import VM
export function useV2vImportVm() {
  const { getVbdsByIds, areVbdsReady } = useXoVbdCollection()

  const { vdis, areVdisReady } = useXoVdiCollection()

  const { getVifsByIds, areVifsReady } = useXoVifCollection()

  function getImportActiveMapping(vm: Pick<XoV2vVm, 'disks' | 'nics'>, importVm: FrontXoVm) {
    return getV2vActiveMapping(vm, vdis.value, getVbdsByIds(importVm.$VBDs), getVifsByIds(importVm.VIFs))
  }

  const areImportDevicesReady = computed(() => areVbdsReady.value && areVdisReady.value && areVifsReady.value)

  return { getImportActiveMapping, areImportDevicesReady }
}
