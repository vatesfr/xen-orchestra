import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoPgpu } from '@vates/types'

export type FrontXoPgpu = Pick<XoPgpu, (typeof pgpuFields)[number]>

const pgpuFields = ['id', 'pci', 'type'] as const satisfies readonly (keyof XoPgpu)[]

export const useXoPgpuCollection = defineRemoteResource({
  url: `${BASE_URL}/pgpus?fields=${pgpuFields.join(',')}&ndjson=true`,
  stream: true,
  initWatchCollection: () => useWatchCollection({ resource: 'PGPU', fields: pgpuFields }),
  initialData: () => [] as FrontXoPgpu[],
  state: (pgpus, context) =>
    useXoCollectionState(pgpus, {
      context,
      baseName: 'pgpu',
    }),
})
