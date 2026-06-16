import type XenApi from '@/libs/xen-api/xen-api'
import type { XenApiPbd, XenApiSr } from '@/libs/xen-api/xen-api.types'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'

export function createSrOperations(xenApi: XenApi) {
  type SrRefs = MaybeArray<XenApiSr['$ref']>

  return {
    destroy: async (srRefs: SrRefs) => {
      await Promise.all(
        toArray(srRefs).map(async srRef => {
          const pbdRefs = await xenApi.getField<XenApiPbd['$ref'][]>('SR', srRef, 'PBDs')

          await Promise.all(pbdRefs.map(pbdRef => xenApi.call('PBD.unplug', [pbdRef])))

          await xenApi.call('SR.destroy', [srRef])
        })
      )
    },
  }
}
