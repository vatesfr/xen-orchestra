import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoVdi } from '@/types/xo/vdi.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export const useXoVdiCollection = defineRemoteResource({
  url: '/rest/v0/vdis?fields=id,name_label,name_description,$VBDs,$SR,size,$pool',
  initialData: () => [] as XoVdi[],
  state: (vdis, context) =>
    useXoCollectionState(vdis, {
      context,
      baseName: 'vdi',
    }),
})
