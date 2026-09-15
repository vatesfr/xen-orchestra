import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { useXoPoolCollection, type FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoVdiCollection, type FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { safePushInMap } from '@/shared/utils/map.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import type { XoSr } from '@vates/types'
import { reactify, useSorted } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

export type FrontXoSr = Pick<XoSr, (typeof srFields)[number]>

const srFields = [
  'id',
  'name_label',
  'name_description',
  '$pool',
  '$container',
  'content_type',
  'physical_usage',
  'usage',
  'size',
  'SR_type',
  'VDIs',
  'type',
  'shared',
  'sm_config',
  'other_config',
  'tags',
  'allocationStrategy',
  '$PBDs',
] as const satisfies readonly (keyof XoSr)[]

export const useXoSrCollection = defineRemoteResource({
  url: `${BASE_URL}/srs?fields=${srFields.join(',')}&ndjson=true`,
  stream: true,
  initWatchCollection: () => useWatchCollection({ resource: 'SR', fields: srFields }),
  initialData: () => [] as FrontXoSr[],
  state: (rawSrs, context) => {
    const sortedSrs = useSorted(rawSrs, (sr1, sr2) => sortByNameLabel(sr1, sr2))

    const { getVdiById } = useXoVdiCollection(context)
    const { getPoolById } = useXoPoolCollection()
    const { pbdsBySr } = useXoPbdCollection()

    const state = useXoCollectionState(sortedSrs, {
      context,
      baseName: 'sr',
    })

    const vdiIsosBySrName = ref<Record<FrontXoSr['name_label'], FrontXoVdi[]>>({})
    const srsByPool = ref(new Map<FrontXoPool['id'], FrontXoSr[]>())

    watch(sortedSrs, srs => {
      const tmpVdiIsosBySrName: Record<FrontXoSr['name_label'], FrontXoVdi[]> = {}
      const tmpSrsByPool = new Map<FrontXoPool['id'], FrontXoSr[]>()

      srs.forEach(sr => {
        if (sr.SR_type === 'iso') {
          tmpVdiIsosBySrName[sr.name_label] = []

          sr.VDIs.forEach(vdiId => {
            const vdi = getVdiById(vdiId as FrontXoVdi['id'])
            if (vdi === undefined) {
              return
            }

            tmpVdiIsosBySrName[sr.name_label].push(vdi)
          })
        }

        safePushInMap(tmpSrsByPool, sr.$pool, sr)
      })

      vdiIsosBySrName.value = tmpVdiIsosBySrName
      srsByPool.value = tmpSrsByPool
    })

    const srsByHost = computed(() => {
      const tmpSrsByHost = new Map<FrontXoHost['id'], FrontXoSr[]>()

      sortedSrs.value.forEach(sr => {
        pbdsBySr.value.get(sr.id)?.forEach(pbd => {
          safePushInMap(tmpSrsByHost, pbd.host, sr)
        })
      })

      return tmpSrsByHost
    })

    const isDefaultSr = (sr: FrontXoSr) => getPoolById(sr.$pool)?.default_SR === sr.id

    const isHighAvailabilitySr = reactify((sr: FrontXoSr) => {
      const srPool = getPoolById(sr.$pool)

      return srPool?.haSrs?.includes(sr.id) ?? false
    })

    return {
      ...state,
      vdiIsosBySrName,
      srsByPool,
      srsByHost,
      isDefaultSr,
      isHighAvailabilitySr,
    }
  },
})
