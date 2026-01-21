import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoPci } from '@vates/types'

const pciFields: (keyof XoPci)[] = ['id', 'device_name', 'type'] as const

export const useXoPciCollection = defineRemoteResource({
  url: `${BASE_URL}/pcis?fields=${pciFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'PCI', fields: pciFields }),
  initialData: () => [] as XoPci[],
  state: (pcis, context) =>
    useXoCollectionState(pcis, {
      context,
      baseName: 'pci',
    }),
})
