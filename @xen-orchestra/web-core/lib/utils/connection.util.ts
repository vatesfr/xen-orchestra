import { CONNECTION_STATUS } from '@core/types/connection.ts'

export function getConnectionStatus(connectionStates: (boolean | undefined)[]) {
  if (connectionStates.length === 0) {
    return CONNECTION_STATUS.DISCONNECTED
  }

  if (connectionStates.every(Boolean)) {
    return CONNECTION_STATUS.CONNECTED
  }

  if (connectionStates.some(Boolean)) {
    return CONNECTION_STATUS.PARTIALLY_CONNECTED
  }

  return CONNECTION_STATUS.DISCONNECTED
}
