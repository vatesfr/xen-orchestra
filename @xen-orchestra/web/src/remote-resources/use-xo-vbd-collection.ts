import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVbd } from '@vates/types'

const vbdFields: (keyof XoVbd)[] = ['id', 'VDI', 'is_cd_drive', 'position'] as const

export const useXoVbdCollection = defineRemoteResource({
  url: '/rest/v0/vbds?fields='.concat(vbdFields.toString()),
  watchCollection: {
    type: 'VBD',
    fields: vbdFields,
  },
  initialData: () => [] as XoVbd[],
  state: (vbds, context) =>
    useXoCollectionState(vbds, {
      context,
      baseName: 'vbd',
    }),
})
