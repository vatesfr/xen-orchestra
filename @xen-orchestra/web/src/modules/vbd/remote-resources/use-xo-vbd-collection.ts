import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVbd } from '@vates/types'

const vbdFields: (keyof XoVbd)[] = ['id', 'VDI', 'VM', 'is_cd_drive', 'position', 'type', 'attached', 'device'] as const

export const useXoVbdCollection = defineRemoteResource({
  url: `/rest/v0/vbds?fields=${vbdFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'VBD', fields: vbdFields }),
  initialData: () => [] as XoVbd[],
  state: (vbds, context) =>
    useXoCollectionState(vbds, {
      context,
      baseName: 'vbd',
    }),
})
