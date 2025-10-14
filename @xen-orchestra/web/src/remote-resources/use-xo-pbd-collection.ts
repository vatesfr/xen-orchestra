import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoPbd } from '@/types/xo/pbd.type'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export const useXoPbdCollection = defineRemoteResource({
  url: '/rest/v0/pbds?fields=id,type,attached,host,SR,device_config,otherConfig,$pool',
  initialData: () => [] as XoPbd[],
  state: (pbds, context) =>
    useXoCollectionState(pbds, {
      context,
      baseName: 'pbd',
    }),
})
