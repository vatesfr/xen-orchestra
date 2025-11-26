import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVdi } from '@vates/types'

export const useXoVmVdisCollection = defineRemoteResource({
  url: (vmId: string) =>
    `/rest/v0/vms/${vmId}/vdis?fields=id,name_label,name_description,usage,size,uuid,tags,cbt_enabled,$VBDs,$SR,image_format`,
  initialData: () => [] as XoVdi[],
  state: (vmVdis, context) => {
    return useXoCollectionState(vmVdis, {
      context,
      baseName: 'vmVdi',
    })
  },
})
