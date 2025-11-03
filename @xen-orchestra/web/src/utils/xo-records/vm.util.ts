import { formatSizeRaw } from '@core/utils/size.util.ts'
import type { XoVm, VM_OPERATIONS } from '@vates/types'
import type { Info, Scale } from 'human-format'
import { castArray } from 'lodash-es'

export function isVmOperatingPending(vm: XoVm, operations: VM_OPERATIONS[] | VM_OPERATIONS) {
  const currentOperations = Object.values(vm.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}

export function getRam(vm: XoVm): Info<Scale<'B' | 'KiB' | 'MiB' | 'GiB' | 'TiB'>> | undefined {
  return formatSizeRaw(vm.memory.size, 1)
}

export function getIpAddresses(vm: XoVm) {
  const addresses = vm.addresses

  return addresses ? [...Object.values(addresses).sort()] : []
}
