import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { watchCollectionWrapper } from '@/utils/sse.util'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoPgpu } from '@vates/types'

const pgpuFields: (keyof XoPgpu)[] = ['id', 'pci', 'type'] as const

export const useXoPgpuCollection = defineRemoteResource({
  url: `/rest/v0/pgpus?fields=${pgpuFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'PGPU', fields: pgpuFields }),
  initialData: () => [] as XoPgpu[],
  state: (pgpus, context) =>
    useXoCollectionState(pgpus, {
      context,
      baseName: 'pgpu',
    }),
})
