import type { FrontXoPbd } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { CONNECTION_STATUS } from '@core/types/connection.ts'

export type PbdsConnectionStatus =
  | typeof CONNECTION_STATUS.CONNECTED
  | typeof CONNECTION_STATUS.PARTIALLY_CONNECTED
  | typeof CONNECTION_STATUS.DISCONNECTED

export function getPbdsConnectionStatus(pbds: FrontXoPbd[]): PbdsConnectionStatus {
  if (pbds.every(pbd => !pbd.attached)) {
    return CONNECTION_STATUS.DISCONNECTED
  }

  if (pbds.some(pbd => !pbd.attached)) {
    return CONNECTION_STATUS.PARTIALLY_CONNECTED
  }

  return CONNECTION_STATUS.CONNECTED
}
