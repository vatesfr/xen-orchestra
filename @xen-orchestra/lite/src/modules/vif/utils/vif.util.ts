import type { XenApiVif } from '@/libs/xen-api/xen-api.types.ts'
import type { RouteLocationAsRelative } from 'vue-router'

export function getVifRoute(vifId: XenApiVif['uuid']): RouteLocationAsRelative {
  return {
    name: '/vif/[uuid]/general',
    params: { uuid: vifId },
  }
}

export function getVifRateLimit(vif: XenApiVif) {
  return vif.qos_algorithm_type === 'ratelimit' ? vif.qos_algorithm_params.kbps : undefined
}
