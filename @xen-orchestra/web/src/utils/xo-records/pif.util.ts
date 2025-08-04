import type { XoPif } from '@/types/xo/pif.type.ts'
import type { ConnectionStatus } from '@core/components/connection-status/VtsConnectionStatus.vue'

export function getPifStatus(pif: XoPif): ConnectionStatus {
  if (!pif.attached) {
    return 'disconnected'
  }

  if (!pif.carrier) {
    return 'disconnected-from-physical-device'
  }

  return 'connected'
}
