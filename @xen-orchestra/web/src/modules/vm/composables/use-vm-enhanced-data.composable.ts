import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVmOperationLabel } from '@/modules/vm/composables/xo-vm-operation-label.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmIcon, getVmIpAddresses } from '@/modules/vm/utils/xo-vm.util.ts'
import type { IconName } from '@core/icons'
import { formatSizeRaw, type SizeInfo } from '@core/utils/size.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoVdi } from '@vates/types'
import { computed, type MaybeRefOrGetter } from 'vue'

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
  vmIcon: IconName
  vmIconTooltip: string
}

export function useVmEnhancedData(rawVms: MaybeRefOrGetter<FrontXoVm[]>) {
  const vms = toComputed(rawVms)
  const { getVbdsByIds } = useXoVbdCollection()
  const { getVdiById } = useXoVdiCollection()
  const { getVmIconTooltip } = useXoVmOperationLabel()

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
    const vmIcon = getVmIcon(vm)
    const vmIconTooltip = getVmIconTooltip(vm)

    return {
      ...vm,
      formattedRam,
      formattedDiskSpace,
      vmIcon,
      vmIconTooltip,
    }
  }

  return {
    filterableVms,
    getDisplayData,
  }
}
