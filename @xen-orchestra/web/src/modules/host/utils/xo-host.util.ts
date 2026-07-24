import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { VtsLinkCellProps } from '@core/components/table/cells/VtsLinkCell.vue'
import { formatSizeRaw, type SizeInfo } from '@core/utils/size.util.ts'
import type { HOST_ALLOWED_OPERATIONS } from '@vates/types'
import { castArray } from 'lodash-es'

export function isHostOperationPending(
  host: FrontXoHost,
  operations: HOST_ALLOWED_OPERATIONS[] | HOST_ALLOWED_OPERATIONS
) {
  const currentOperations = Object.values(host.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}

export function getHostInfo(host: FrontXoHost | undefined): VtsLinkCellProps & { label: string } {
  return host ? { label: host.name_label, to: `/host/${host.id}/dashboard` } : { label: '' }
}

export function getHostCoreSocketInfo(host: FrontXoHost): string {
  return `${host.cpus.cores ?? 0} (${host.cpus.sockets ?? 0})`
}

export function getHostManufacturerInfo(host: FrontXoHost): string {
  const manufacturer = host.bios_strings['system-manufacturer'] ?? ''
  const productName = host.bios_strings['system-product-name']

  return manufacturer + (productName ? ` (${productName})` : '')
}

export function getHostRamProvisioning(host: FrontXoHost): { total: SizeInfo; used: SizeInfo; free: SizeInfo } {
  const size = host.memory.size
  const usage = host.memory.usage

  return {
    total: formatSizeRaw(size, 0),
    used: formatSizeRaw(usage, 0),
    free: formatSizeRaw(size - usage, 0),
  }
}
