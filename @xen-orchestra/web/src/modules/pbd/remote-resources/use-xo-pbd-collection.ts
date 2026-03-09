import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoHost, XoPbd, XoSr } from '@vates/types'
import { computed } from 'vue'

export type FrontXoPbd = Pick<XoPbd, (typeof pbdFields)[number]>

const pbdFields = [
  'id',
  'type',
  'attached',
  'host',
  'SR',
  'device_config',
  'otherConfig',
  '$pool',
] as const satisfies readonly (keyof XoPbd)[]

export const useXoPbdCollection = defineRemoteResource({
  url: `${BASE_URL}/pbds?fields=${pbdFields.join(',')}`,
  initWatchCollection: () => useWatchCollection({ resource: 'PBD', fields: pbdFields }),
  initialData: () => [] as FrontXoPbd[],
  state: (pbds, context) => {
    const state = useXoCollectionState(pbds, {
      context,
      baseName: 'pbd',
    })

    const pbdsBySr = computed(() => {
      const pbdsBySrMap = new Map<XoSr['id'], FrontXoPbd[]>()

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
      const pbdsByHostMap = new Map<XoHost['id'], FrontXoPbd[]>()

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
