import type { FrontXoPbd } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { CONNECTION_STATUS } from '@core/types/connection.ts'

export function getPbdsConnectionStatus(pbds: FrontXoPbd[]) {
  if (pbds.every(pbd => !pbd.attached)) {
    return CONNECTION_STATUS.DISCONNECTED
  }

  if (pbds.some(pbd => !pbd.attached)) {
    return CONNECTION_STATUS.PARTIALLY_CONNECTED
  }

  return CONNECTION_STATUS.CONNECTED
}
