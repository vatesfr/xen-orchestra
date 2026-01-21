import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVif } from '@vates/types'

const vifFields: (keyof XoVif)[] = [
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
] as const

export const useXoVifCollection = defineRemoteResource({
  url: `${BASE_URL}/vifs?fields=${vifFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'VIF', fields: vifFields }),
  initialData: () => [] as XoVif[],
  state: (vifs, context) =>
    useXoCollectionState(vifs, {
      context,
      baseName: 'vif',
    }),
})
