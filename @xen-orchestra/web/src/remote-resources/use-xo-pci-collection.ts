import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { watchCollectionWrapper } from '@/utils/sse.util'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoPci } from '@vates/types'

const pciFields: (keyof XoPci)[] = ['id', 'device_name', 'type'] as const

export const useXoPciCollection = defineRemoteResource({
  url: '/rest/v0/pcis?fields='.concat(pciFields.toString()),
  watchCollection: watchCollectionWrapper({ resource: 'PCI', fields: pciFields }),
  initialData: () => [] as XoPci[],
  state: (pcis, context) =>
    useXoCollectionState(pcis, {
      context,
      baseName: 'pci',
    }),
})
