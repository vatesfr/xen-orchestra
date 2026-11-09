import type { XenApiPbd } from '@/libs/xen-api/xen-api.types.ts'
import { CONNECTION_STATUS } from '@core/types/connection.ts'

export const getPbdsConnectionStatus = (pbds: XenApiPbd[]) => {
  if (pbds.length === 0 || pbds.every(pbd => !pbd.currently_attached)) {
    return CONNECTION_STATUS.DISCONNECTED
  }

  if (pbds.some(pbd => !pbd.currently_attached)) {
    return CONNECTION_STATUS.PARTIALLY_CONNECTED
  }

  return CONNECTION_STATUS.CONNECTED
}
