import type { XenApiPbd, XenApiSr } from '@/libs/xen-api/xen-api.types'
import { usePbdUtils } from '@/modules/storage-repository/composables/pbd-utils.composable'
import { SR_SCOPE_TYPE, type SrScope } from '@/modules/storage-repository/types/storage-repository.type'
import { usePbdStore } from '@/stores/xen-api/pbd.store'
import { type IconName, objectIcon } from '@core/icons'
import { toComputed } from '@core/utils/to-computed.util'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useGetPbdsInScope() {
  const { getPbdsForSr } = usePbdStore().subscribe()

  function getPbdsInScope(sr: XenApiSr, scope: SrScope): XenApiPbd[] {
    const pbds = getPbdsForSr(sr.$ref)

    if (scope.type === SR_SCOPE_TYPE.POOL) {
      return pbds
    }

    const { hostRef } = scope

    return pbds.filter(pbd => pbd.host === hostRef)
  }

  function getAttachedPbdsInScope(sr: XenApiSr, scope: SrScope): XenApiPbd[] {
    return getPbdsInScope(sr, scope).filter(pbd => pbd.currently_attached)
  }

  function getDetachedPbdsInScope(sr: XenApiSr, scope: SrScope): XenApiPbd[] {
    return getPbdsInScope(sr, scope).filter(pbd => !pbd.currently_attached)
  }

  function getSrPbdsSignature(sr: XenApiSr, scope: SrScope) {
    const scopedPbds = getPbdsInScope(sr, scope)

    return scopedPbds.map(pbd => `${pbd.uuid}:${pbd.currently_attached}`).join('|') || sr.uuid
  }

  function isPartiallyConnectedInScope(sr: XenApiSr, scope: SrScope) {
    const pbds = getPbdsInScope(sr, scope)

    return pbds.some(pbd => pbd.currently_attached) && pbds.some(pbd => !pbd.currently_attached)
  }

  return {
    getPbdsInScope,
    getAttachedPbdsInScope,
    getDetachedPbdsInScope,
    getSrPbdsSignature,
    isPartiallyConnectedInScope,
  }
}

export function useSrUtils(
  rawSr?: MaybeRefOrGetter<XenApiSr | undefined>,
  rawScope: MaybeRefOrGetter<SrScope> = { type: SR_SCOPE_TYPE.POOL }
) {
  const sr = toComputed(rawSr)
  const scope = toComputed(rawScope)

  const { getPbdsInScope, isPartiallyConnectedInScope: getIsPartiallyConnectedInScope } = useGetPbdsInScope()

  const pbdsInScope = computed(() => {
    if (sr.value === undefined) {
      return []
    }

    return getPbdsInScope(sr.value, scope.value)
  })

  const isPartiallyConnectedInScope = computed(() => {
    if (sr.value === undefined) {
      return false
    }

    return getIsPartiallyConnectedInScope(sr.value, scope.value)
  })

  const { allPbdsConnectionStatus } = usePbdUtils(pbdsInScope)

  const srStatusIcon = computed<IconName>(() => objectIcon('sr', allPbdsConnectionStatus.value))

  return {
    pbdsInScope,
    srConnectionStatus: allPbdsConnectionStatus,
    isPartiallyConnectedInScope,
    srStatusIcon,
  }
}
