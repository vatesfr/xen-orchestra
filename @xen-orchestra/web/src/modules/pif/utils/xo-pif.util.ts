import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { Status } from '@core/components/status/VtsStatus.vue'
import { CONNECTION_STATUS } from '@core/types/connection.ts'

export function getPifStatus(pif: FrontXoPif): Status {
  if (!pif.attached) {
    return CONNECTION_STATUS.DISCONNECTED
  }

  if (!pif.carrier) {
    return CONNECTION_STATUS.DISCONNECTED_FROM_PHYSICAL_DEVICE
  }

  return CONNECTION_STATUS.CONNECTED
}

export function getPifIpAddresses(pif: FrontXoPif): string[] {
  return [pif.ip, ...(pif.ipv6 ?? [])].filter(ip => ip)
}

export function getPifsIpAddresses(pifs?: FrontXoPif[]): string[] {
  return pifs?.flatMap(getPifIpAddresses) ?? []
}

export function getHostIpAddresses(managementIp: string, pifs?: FrontXoPif[]): string[] {
  const others = getPifsIpAddresses(pifs).filter(ip => ip !== managementIp)

  return managementIp ? [managementIp, ...others] : others
}
