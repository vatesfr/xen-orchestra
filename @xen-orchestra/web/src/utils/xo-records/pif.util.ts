import type { XoPif } from '@/types/xo/pif.type.ts'
import type { Status } from '@core/components/status/VtsStatus.vue'

export function getPifStatus(pif: XoPif): Status {
  if (!pif.attached) {
    return 'disconnected'
  }

  if (!pif.carrier) {
    return 'disconnected-from-physical-device'
  }

  return 'connected'
}
