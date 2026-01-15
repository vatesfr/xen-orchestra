import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { useWatchCollection } from '@core/composables/watch-collection.composable.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVbd } from '@vates/types'

const vbdFields = [
  'id',
  'VDI',
  'VM',
  'is_cd_drive',
  'position',
  'type',
  'attached',
  'device',
] as const satisfies readonly (keyof XoVbd)[]

export const useXoVbdCollection = defineRemoteResource({
  url: `${BASE_URL}/vbds?fields=${vbdFields.join(',')}`,
  initWatchCollection: () => useWatchCollection({ resource: 'VBD', fields: vbdFields }),
  initialData: () => [] as Pick<XoVbd, (typeof vbdFields)[number]>[],
  state: (vbds, context) =>
    useXoCollectionState(vbds, {
      context,
      baseName: 'vbd',
    }),
})
