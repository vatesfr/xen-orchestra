import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { vdiFields, type FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { toValue } from 'vue'

export const useXoVmVdisCollection = defineRemoteResource({
  url: (vmId: string) => `${BASE_URL}/vms/${vmId}/vdis?fields=${vdiFields.join(',')}`,
  initialData: () => [] as FrontXoVdi[],
  watchCollection: watchCollectionWrapper<FrontXoVdi>({
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
