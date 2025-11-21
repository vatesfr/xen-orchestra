import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVdi } from '@vates/types'

const vdiFields: (keyof XoVdi)[] = ['id', 'name_label', 'name_description', '$VBDs', '$SR', 'size', '$pool'] as const

export const useXoVdiCollection = defineRemoteResource({
  url: '/rest/v0/vdis?fields='.concat(vdiFields.toString()),
  watchCollection: {
    type: 'VDI',
    fields: vdiFields,
  },
  initialData: () => [] as XoVdi[],
  state: (vdis, context) =>
    useXoCollectionState(vdis, {
      context,
      baseName: 'vdi',
    }),
})
