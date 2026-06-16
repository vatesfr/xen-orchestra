import type XenApi from '@/libs/xen-api/xen-api'
import type { XenApiPbd } from '@/libs/xen-api/xen-api.types'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'

export function createPbdOperations(xenApi: XenApi) {
  type PbdRefs = MaybeArray<XenApiPbd['$ref']>

  return {
    plug: (pbdRefs: PbdRefs) => Promise.all(toArray(pbdRefs).map(pbdRef => xenApi.call('PBD.plug', [pbdRef]))),

    unplug: (pbdRefs: PbdRefs) => Promise.all(toArray(pbdRefs).map(pbdRef => xenApi.call('PBD.unplug', [pbdRef]))),
  }
}
