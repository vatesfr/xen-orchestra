import type XenApi from '@/libs/xen-api/xen-api.ts'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'

export function createPifOperations(xenApi: XenApi) {
  return {
    scan: (hostRef: XenApiHost['$ref']) => xenApi.call('PIF.scan', [hostRef]),
  }
}
