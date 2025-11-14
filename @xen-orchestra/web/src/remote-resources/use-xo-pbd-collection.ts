import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoPbd, XoSr } from '@vates/types'
import { computed } from 'vue'

export const useXoPbdCollection = defineRemoteResource({
  url: '/rest/v0/pbds?fields=id,type,attached,host,SR,device_config,otherConfig,$pool',
  initialData: () => [] as XoPbd[],
  state: (pbds, context) => {
    const state = useXoCollectionState(pbds, {
      context,
      baseName: 'pbd',
    })

    const pbdsBySr = computed(() => {
      const pbdsBySrMap = new Map<XoSr['id'], XoPbd[]>()

      pbds.value.forEach(pbd => {
        const srId = pbd.SR

        if (!pbdsBySrMap.has(srId)) {
          pbdsBySrMap.set(srId, [])
        }

        pbdsBySrMap.get(srId)!.push(pbd)
      })

      return pbdsBySrMap
    })

    return {
      ...state,
      pbdsBySr,
    }
  },
})
