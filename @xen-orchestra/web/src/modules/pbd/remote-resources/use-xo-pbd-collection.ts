import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection'
import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { safePushInMap } from '@/shared/utils/map.util'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoPbd } from '@vates/types'
import { ref, watch } from 'vue'

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

    const pbdsBySr = ref(new Map<FrontXoSr['id'], FrontXoPbd[]>())
    const pbdsByHost = ref(new Map<FrontXoHost['id'], FrontXoPbd[]>())

    watch(pbds, _pbds => {
      const tmpPbdsBySr = new Map<FrontXoSr['id'], FrontXoPbd[]>()
      const tmpPbdsByHost = new Map<FrontXoHost['id'], FrontXoPbd[]>()

      _pbds.forEach(pbd => {
        safePushInMap(tmpPbdsBySr, pbd.SR, pbd)
        safePushInMap(tmpPbdsByHost, pbd.host, pbd)
      })

      pbdsBySr.value = tmpPbdsBySr
      pbdsByHost.value = tmpPbdsByHost
    })

    return {
      ...state,
      pbdsBySr,
      pbdsByHost,
    }
  },
})
