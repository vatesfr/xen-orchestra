import type XenApi from '@/libs/xen-api/xen-api.ts'
import type { XenApiHost, XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import type { MaybeArray } from '@core/types/utility.type.ts'
import { toArray } from '@core/utils/to-array.utils.ts'

export function createPifOperations(xenApi: XenApi) {
  type PifRefs = MaybeArray<XenApiPif['$ref']>

  return {
    scan: (hostRef: XenApiHost['$ref']) => xenApi.call('PIF.scan', [hostRef]),
    delete: (pifRefs: PifRefs) => Promise.all(toArray(pifRefs).map(pifRef => xenApi.call('PIF.destroy', [pifRef]))),
  }
}
