import type { XenApiVif } from '@/libs/xen-api/xen-api.types.ts'

export function isTxChecksummingEnabled(vif: XenApiVif) {
  const value = vif.other_config['ethtool-tx']

  return value !== 'false' && value !== 'off'
}
