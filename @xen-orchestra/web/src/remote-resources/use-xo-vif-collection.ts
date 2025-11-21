import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
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
] as const

export const useXoVifCollection = defineRemoteResource({
  url: '/rest/v0/vifs?fields='.concat(vifFields.toString()),
  watchCollection: {
    type: 'VIF',
    fields: vifFields,
  },
  initialData: () => [] as XoVif[],
  state: (vifs, context) =>
    useXoCollectionState(vifs, {
      context,
      baseName: 'vif',
    }),
})
