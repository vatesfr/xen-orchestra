import type XenApi from '@/libs/xen-api/xen-api.ts'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'

export function createPoolOperations(xenApi: XenApi) {
  type HostRef = XenApiHost['$ref']

  const eject = (hostRef: HostRef) => xenApi.call('pool.eject', [hostRef])

  return {
    eject,
  }
}
