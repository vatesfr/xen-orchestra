import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { useWatchCollection } from '@core/composables/watch-collection.composable.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVif } from '@vates/types'

export type FrontXoVif = Pick<XoVif, (typeof vifFields)[number]>

const vifFields = [
  '$VM',
  '$network',
  'attached',
  'device',
  'txChecksumming',
  'id',
  'lockingMode',
  'MAC',
  'MTU',
  'type',
] as const satisfies readonly (keyof XoVif)[]

export const useXoVifCollection = defineRemoteResource({
  url: `${BASE_URL}/vifs?fields=${vifFields.join(',')}`,
  initWatchCollection: () => useWatchCollection({ resource: 'VIF', fields: vifFields }),
  initialData: () => [] as FrontXoVif[],
  state: (vifs, context) =>
    useXoCollectionState(vifs, {
      context,
      baseName: 'vif',
    }),
})
