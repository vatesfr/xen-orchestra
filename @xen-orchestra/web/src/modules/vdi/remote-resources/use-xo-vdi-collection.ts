import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVdi } from '@vates/types'

export const vdiFields: (keyof XoVdi)[] = [
  'id',
  'name_label',
  'name_description',
  '$VBDs',
  '$SR',
  'size',
  '$pool',
  'type',
  'usage',
  'tags',
  'uuid',
  'cbt_enabled',
  'image_format',
] as const

export const useXoVdiCollection = defineRemoteResource({
  url: `/rest/v0/vdis?fields=${vdiFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'VDI', fields: vdiFields }),
  initialData: () => [] as XoVdi[],
  state: (vdis, context) =>
    useXoCollectionState(vdis, {
      context,
      baseName: 'vdi',
    }),
})
