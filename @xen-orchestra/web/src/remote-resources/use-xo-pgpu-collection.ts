import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoPgpu } from '@vates/types'

export const useXoPgpuCollection = defineRemoteResource({
  url: '/rest/v0/pgpus?fields=id,pci',
  initialData: () => [] as XoPgpu[],
  state: (pgpus, context) =>
    useXoCollectionState(pgpus, {
      context,
      baseName: 'pgpu',
    }),
})
