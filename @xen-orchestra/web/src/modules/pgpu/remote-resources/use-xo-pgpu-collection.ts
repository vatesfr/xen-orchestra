import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoPgpu } from '@vates/types'

const pgpuFields: (keyof XoPgpu)[] = ['id', 'pci', 'type'] as const

export const useXoPgpuCollection = defineRemoteResource({
  url: `${BASE_URL}/pgpus?fields=${pgpuFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'PGPU', fields: pgpuFields }),
  initialData: () => [] as XoPgpu[],
  state: (pgpus, context) =>
    useXoCollectionState(pgpus, {
      context,
      baseName: 'pgpu',
    }),
})
