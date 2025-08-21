import type { ConnectionStatus } from '@core/components/connection-status/VtsConnectionStatus.vue'
import type { XoPif } from '@vates/types'

export function getPifStatus(pif: XoPif): ConnectionStatus {
  if (!pif.attached) {
    return 'disconnected'
  }

  if (!pif.carrier) {
    return 'disconnected-from-physical-device'
  }

  return 'connected'
}
