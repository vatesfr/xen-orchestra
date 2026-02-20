import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmIpAddresses } from '@/modules/vm/utils/xo-vm.util.ts'
import { objectIcon } from '@core/icons'
import { formatSizeRaw, type SizeInfo } from '@core/utils/size.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoVdi } from '@vates/types'
import type { MaybeRefOrGetter } from '@vueuse/core'
import { toLower } from 'lodash-es'
import { computed } from 'vue'

export interface VmFilterableData extends FrontXoVm {
  // Raw values for filtering
  ramSize: number // raw bytes
  diskSpaceSize: number // raw bytes
  ipAddresses: string[]
}

export interface VmDisplayData extends VmFilterableData {
  // Formatted values for UI display
  formattedRam: SizeInfo
  formattedDiskSpace: SizeInfo
  vmIcon: ReturnType<typeof objectIcon>
}

export function useVmEnhancedData(rawVms: MaybeRefOrGetter<FrontXoVm[]>) {
  const vms = toComputed(rawVms)
  const { getVbdsByIds } = useXoVbdCollection()
  const { getVdiById } = useXoVdiCollection()

  /**
   * Calculate raw disk space in bytes
   */
  const getRawDiskSpace = (vm: FrontXoVm): number => {
    return getVbdsByIds(vm.$VBDs).reduce((sum, vbd) => {
      const vdi = getVdiById(vbd?.VDI as XoVdi['id'])
      return sum + (vdi?.size || 0)
    }, 0)
  }

  /**
   * Filterable data: raw values for Query Builder schema
   */
  const filterableVms = computed(() =>
    vms.value.map(
      vm =>
        ({
          ...vm,
          ramSize: vm.memory.size, // raw bytes
          diskSpaceSize: getRawDiskSpace(vm), // raw bytes
          ipAddresses: getVmIpAddresses(vm),
        }) as VmFilterableData
    )
  )

  /**
   * Display data: enhanced VM with formatted values for table rendering
   */
  const getDisplayData = (vm: VmFilterableData): VmDisplayData => {
    const formattedRam = formatSizeRaw(vm.ramSize, 1)
    const formattedDiskSpace = formatSizeRaw(vm.diskSpaceSize, 1)
    const vmIcon = objectIcon('vm', toLower(vm.power_state))

    return {
      ...vm,
      formattedRam,
      formattedDiskSpace,
      vmIcon,
    }
  }

  return {
    filterableVms,
    getDisplayData,
  }
}
