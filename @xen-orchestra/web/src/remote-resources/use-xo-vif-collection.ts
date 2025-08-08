import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoVif } from '@/types/xo/vif.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export const useXoVifCollection = defineRemoteResource({
  url: '/rest/v0/vifs?fields=$VM,$network,attached,device,txChecksumming,id,lockingMode,MAC,MTU',
  initialData: () => [] as XoVif[],
  state: (vifs, context) =>
    useXoCollectionState(vifs, {
      context,
      baseName: 'vif',
    }),
})
