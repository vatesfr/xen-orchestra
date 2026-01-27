import type { VtsLinkCellProps } from '@core/components/table/cells/VtsLinkCell.vue'
import type { HOST_ALLOWED_OPERATIONS, XoHost } from '@vates/types'
import { castArray } from 'lodash-es'

export function isHostOperationPending(host: XoHost, operations: HOST_ALLOWED_OPERATIONS[] | HOST_ALLOWED_OPERATIONS) {
  const currentOperations = Object.values(host.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}

export function getHostInfo(host: XoHost | undefined): VtsLinkCellProps & { label: string } {
  return host ? { label: host.name_label, to: `/host/${host.id}/dashboard` } : { label: '' }
}
