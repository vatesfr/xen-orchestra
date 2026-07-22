import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { type FrontXoVdi, vdiFields } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { whenever } from '@vueuse/shared'
import { toValue } from 'vue'

export const useXoVmVdisCollection = defineRemoteResource({
  url: (vmId: string) => `${BASE_URL}/vms/${vmId}/vdis?fields=${vdiFields.join(',')}&ndjson=true`,
  stream: true,
  initialData: () => [] as FrontXoVdi[],
  initWatchCollection: () =>
    useWatchCollection<FrontXoVdi>({
      collectionId: 'vmVdi',
      resource: 'VDI',
      fields: vdiFields,
      async predicate(obj, context) {
        if (context === undefined || context.args === undefined || Array.isArray(obj)) {
          return true
        }

        const [id] = context.args
        const vmId = toValue(id)

        const { useGetVbdsByIds, areVbdsReady } = useXoVbdCollection(context)
        if (!areVbdsReady.value) {
          await new Promise(resolve => {
            whenever(() => areVbdsReady.value, resolve)
          })
        }

        const vbds = useGetVbdsByIds(obj.$VBDs).value
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
