import { useXoVbdCollection } from '@/remote-resources/use-xo-vbd-collection'
import { useXoVdiCollection } from '@/remote-resources/use-xo-vdi-collection'
import type { XoVbd } from '@/types/xo/vbd.type'
import type { XoVm } from '@/types/xo/vm.type'
import { formatSizeRaw } from '@core/utils/size.util'
import type { Info, Scale } from 'human-format'

export function useXoVmUtils() {
  const { getVbdById } = useXoVbdCollection()
  const { getVdiById } = useXoVdiCollection()

  function getRam(vm: XoVm): Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>> | undefined {
    return formatSizeRaw(vm.memory.size, 1)
  }

  function getIpAddresses(vm: XoVm) {
    const addresses = vm.addresses

    return addresses ? [...Object.values(addresses).sort()] : []
  }

  function getDiskSpace(vm: XoVm): Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>> | undefined {
    const vdis = [...vm.$VBDs].map(vbdId => getVbdById(vbdId as XoVbd['id'])?.VDI)

    const totalSize = vdis.map(vdiId => getVdiById(vdiId)?.size || 0).reduce((sum, size) => sum + size, 0)

    return formatSizeRaw(totalSize, 1)
  }

  return {
    getRam,
    getIpAddresses,
    getDiskSpace,
  }
}
