import type XenApi from '@/libs/xen-api/xen-api'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'

export function createPifOperations(xenApi: XenApi) {
  return {
    scan: (hostRef: XenApiHost['$ref']) => xenApi.call('PIF.scan', [hostRef]),
  }
}
