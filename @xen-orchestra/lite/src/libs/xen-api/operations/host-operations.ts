import type XenApi from '@/libs/xen-api/xen-api'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'

export function createHostOperations(xenApi: XenApi) {
  return {
    scanPifs: (hostRef: XenApiHost['$ref']) => xenApi.call('PIF.scan', [hostRef]),
  }
}
