import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { watchCollectionWrapper } from '@/utils/sse.util'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVdi } from '@vates/types'
import { toValue } from 'vue'
import { useXoVbdCollection } from './use-xo-vbd-collection'
import { vdiFields } from './use-xo-vdi-collection'

export const useXoVmVdisCollection = defineRemoteResource({
  url: (vmId: string) => `/rest/v0/vms/${vmId}/vdis?fields=${vdiFields.join(',')}`,
  initialData: () => [] as XoVdi[],
  watchCollection: watchCollectionWrapper<XoVdi>({
    collectionId: 'vmVdi',
    resource: 'VDI',
    fields: vdiFields,
    predicate(obj, context) {
      if (context === undefined || context.args === undefined || Array.isArray(obj)) {
        return true
      }

      const [id] = context.args
      const vmId = toValue(id)

      const { getVbdsByIds } = useXoVbdCollection(context)
      const vbds = getVbdsByIds(obj.$VBDs)

      return vbds.some(vbd => vbd.VM === vmId)
    },
  }),
  state: (vmVdis, context) => {
    return useXoCollectionState(vmVdis, {
      context,
      baseName: 'vmVdi',
    })
  },
})
