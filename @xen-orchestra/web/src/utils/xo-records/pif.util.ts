import type { Status } from '@core/components/status/VtsStatus.vue'
import type { XoPif } from '@vates/types'

export function getPifStatus(pif: XoPif): Status {
  if (!pif.attached) {
    return 'disconnected'
  }

  if (!pif.carrier) {
    return 'disconnected-from-physical-device'
  }

  return 'connected'
}
