import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { watchCollectionWrapper } from '@/utils/sse.util'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoHost, XoPbd, XoSr } from '@vates/types'
import { computed } from 'vue'

const pbdFields: (keyof XoPbd)[] = ['id', 'type', 'attached', 'host', 'SR', 'device_config', 'otherConfig', '$pool']

export const useXoPbdCollection = defineRemoteResource({
  url: `/rest/v0/pbds?fields=${pbdFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'PBD', fields: pbdFields }),
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

    const pbdsByHost = computed(() => {
      const pbdsByHostMap = new Map<XoHost['id'], XoPbd[]>()

      pbds.value.forEach(pbd => {
        const hostId = pbd.host

        if (!pbdsByHostMap.has(hostId)) {
          pbdsByHostMap.set(hostId, [])
        }

        pbdsByHostMap.get(hostId)!.push(pbd)
      })

      return pbdsByHostMap
    })

    return {
      ...state,
      pbdsBySr,
      pbdsByHost,
    }
  },
})
