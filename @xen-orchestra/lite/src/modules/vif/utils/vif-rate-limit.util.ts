import type { XenApiVif } from '@/libs/xen-api/xen-api.types.ts'

export function getVifRateLimit(vif: XenApiVif): number | undefined {
  const { kbps } = vif.qos_algorithm_params

  return vif.qos_algorithm_type === 'ratelimit' && kbps !== undefined ? Number(kbps) : undefined
}
