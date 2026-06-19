import type XenApi from '@/libs/xen-api/xen-api.ts'
import type { XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import type { MaybeArray } from '@core/types/utility.type.ts'
import { toArray } from '@core/utils/to-array.utils.ts'

export function createSrOperations(xenApi: XenApi) {
  type SrRefs = MaybeArray<XenApiSr['$ref']>

  return {
    destroy: async (srRefs: SrRefs) => {
      await Promise.all(
        toArray(srRefs).map(async srRef => {
          const pbdRefs = await xenApi.getField<XenApiSr['PBDs']>('SR', srRef, 'PBDs')

          const attachedRefs = (
            await Promise.all(
              pbdRefs.map(async pbdRef => ({
                pbdRef,
                attached: await xenApi.getField<boolean>('PBD', pbdRef, 'currently_attached'),
              }))
            )
          )
            .filter(({ attached }) => attached)
            .map(({ pbdRef }) => pbdRef)

          if (attachedRefs.length > 0) {
            await xenApi.pbd.unplug(attachedRefs)
          }

          await xenApi.call('SR.destroy', [srRef])
        })
      )
    },
  }
}
