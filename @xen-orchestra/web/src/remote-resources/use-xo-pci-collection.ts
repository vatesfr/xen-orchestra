import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoPci } from '@/types/xo/pci.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export const useXoPciCollection = defineRemoteResource({
  url: '/rest/v0/pcis?fields=id,device_name',
  initialData: () => [] as XoPci[],
  state: (pcis, context) =>
    useXoCollectionState(pcis, {
      context,
      baseName: 'pci',
    }),
})
