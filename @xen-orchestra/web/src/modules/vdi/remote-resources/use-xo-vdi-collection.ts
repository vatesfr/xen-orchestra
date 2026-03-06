import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVdi } from '@vates/types'

export type FrontXoVdi = Pick<XoVdi, (typeof vdiFields)[number]>

export const vdiFields = [
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
] as const satisfies readonly (keyof XoVdi)[]

export const useXoVdiCollection = defineRemoteResource({
  url: `${BASE_URL}/vdis?fields=${vdiFields.join(',')}`,
  initWatchCollection: () => useWatchCollection({ resource: 'VDI', fields: vdiFields }),
  initialData: () => [] as FrontXoVdi[],
  state: (vdis, context) =>
    useXoCollectionState(vdis, {
      context,
      baseName: 'vdi',
    }),
})
