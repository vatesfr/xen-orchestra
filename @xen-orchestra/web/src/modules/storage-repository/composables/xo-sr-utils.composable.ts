import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdUtils } from '@/modules/pbd/composables/xo-pbd-utils.composable.ts'
import { useXoPbdCollection, type FrontXoPbd } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { type IconName, objectIcon } from '@core/icons'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useGetPbdsInScope() {
  const { getPbdsByIds } = useXoPbdCollection()

  function getPbdsInScope(sr: FrontXoSr, scope: SrScope): FrontXoPbd[] {
    const pbds = getPbdsByIds(sr.$PBDs)

    if (scope.type === SR_SCOPE_TYPE.POOL) {
      return pbds
    }

    const { hostId } = scope

    return pbds.filter(pbd => pbd.host === hostId)
  }

  function getAttachedPbdsInScope(sr: FrontXoSr, scope: SrScope): FrontXoPbd[] {
    return getPbdsInScope(sr, scope).filter(pbd => pbd.attached)
  }

  function getDetachedPbdsInScope(sr: FrontXoSr, scope: SrScope): FrontXoPbd[] {
    return getPbdsInScope(sr, scope).filter(pbd => !pbd.attached)
  }

  function getSrPbdsSignature(sr: FrontXoSr | undefined, scope: SrScope) {
    if (sr === undefined) {
      return scope.type === 'host' ? `host:${scope.hostId}` : 'pool'
    }

    const scopedPbds = getPbdsInScope(sr, scope)

    return scopedPbds.map(pbd => `${pbd.id}:${pbd.attached}`).join('|') || sr.id
  }

  function isPartiallyConnectedInScope(sr: FrontXoSr, scope: SrScope) {
    const pbds = getPbdsInScope(sr, scope)

    return pbds.some(pbd => pbd.attached) && pbds.some(pbd => !pbd.attached)
  }

  return {
    getPbdsInScope,
    getAttachedPbdsInScope,
    getDetachedPbdsInScope,
    getSrPbdsSignature,
    isPartiallyConnectedInScope,
  }
}

export function useXoSrUtils(
  rawSr?: MaybeRefOrGetter<FrontXoSr | undefined>,
  rawScope: MaybeRefOrGetter<SrScope> = { type: SR_SCOPE_TYPE.POOL }
) {
  const { t } = useI18n()

  const sr = toComputed(rawSr)
  const scope = toComputed(rawScope)

  const { getPbdsInScope, isPartiallyConnectedInScope: getIsPartiallyConnectedInScope } = useGetPbdsInScope()
  const { pbdsBySr } = useXoPbdCollection()
  const { getHostById } = useXoHostCollection()

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

  const { allPbdsConnectionStatus } = useXoPbdUtils(pbdsInScope)

  const srStatusIcon = computed<IconName>(() => objectIcon('sr', allPbdsConnectionStatus.value))

  function getSrLocation(sr: FrontXoSr): string {
    if (sr.shared) {
      return t('shared')
    }

    const hostName = pbdsBySr.value
      .get(sr.id)
      ?.map(pbd => getHostById(pbd.host)?.name_label)
      .find(name => name !== undefined)

    return hostName ?? t('unknown')
  }

  return {
    pbdsInScope,
    srConnectionStatus: allPbdsConnectionStatus,
    isPartiallyConnectedInScope,
    srStatusIcon,
    getSrLocation,
  }
}
