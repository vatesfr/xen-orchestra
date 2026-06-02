import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdUtils } from '@/modules/pbd/composables/xo-pbd-utils.composable.ts'
import { useXoPbdCollection, type FrontXoPbd } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { SrAccessMode, SrScope } from '@/modules/storage-repository/types/storage-repository.type'
import { getSrModalMessageKeys } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import { type IconName, objectIcon } from '@core/icons'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useGetPbdsInScope() {
  const { getPbdsByIds } = useXoPbdCollection()

  function getPbdsInScope(sr: FrontXoSr, scope: SrScope): FrontXoPbd[] {
    const pbds = getPbdsByIds(sr.$PBDs)

    if (scope.type === 'pool') {
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

  function getSrPbdsSignature(sr: FrontXoSr, scope: SrScope) {
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

export function useSrModalMessages(options: {
  action: 'connect' | 'disconnect'
  count: MaybeRefOrGetter<number>
  scope: MaybeRefOrGetter<SrScope>
  accessMode: MaybeRefOrGetter<SrAccessMode>
  hostsCount: MaybeRefOrGetter<number>
}) {
  const { t } = useI18n()

  const count = toComputed(options.count)
  const scope = toComputed(options.scope)
  const accessMode = toComputed(options.accessMode)
  const hostsCount = toComputed(options.hostsCount)

  const keys = computed(() =>
    getSrModalMessageKeys({
      action: options.action,
      scope: scope.value,
      accessMode: accessMode.value,
    })
  )

  return {
    title: computed(() => t(keys.value.titleKey, { n: count.value, hostsCount: hostsCount.value })),
    info: computed(() => t(keys.value.infoKey, { n: count.value, hostsCount: hostsCount.value })),
  }
}

export function useXoSrUtils(
  rawSr?: MaybeRefOrGetter<FrontXoSr | undefined>,
  rawScope: MaybeRefOrGetter<SrScope> = { type: 'pool' }
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
