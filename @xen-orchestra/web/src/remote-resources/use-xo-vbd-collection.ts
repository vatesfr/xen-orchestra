import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVbd } from '@vates/types'

export const useXoVbdCollection = defineRemoteResource({
  url: '/rest/v0/vbds?fields=id,name_label,name_description,VDI,is_cd_drive,position',
  initialData: () => [] as XoVbd[],
  state: (vbds, context) =>
    useXoCollectionState(vbds, {
      context,
      baseName: 'vbd',
    }),
})
