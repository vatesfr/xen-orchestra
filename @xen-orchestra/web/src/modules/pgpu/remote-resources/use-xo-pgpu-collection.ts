import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoPgpu } from '@vates/types'

const pgpuFields = ['id', 'pci', 'type'] as const satisfies readonly (keyof XoPgpu)[]

export const useXoPgpuCollection = defineRemoteResource({
  url: `${BASE_URL}/pgpus?fields=${pgpuFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'PGPU', fields: pgpuFields }),
  initialData: () => [] as Pick<XoPgpu, (typeof pgpuFields)[number]>[],
  state: (pgpus, context) =>
    useXoCollectionState(pgpus, {
      context,
      baseName: 'pgpu',
    }),
})
