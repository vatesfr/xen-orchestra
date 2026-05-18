import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdUtils } from '@/modules/pbd/composables/xo-pbd-utils.composable.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { StorageScope } from '@/modules/storage-repository/types/storage-scope.type.ts'
import { type IconName, objectIcon } from '@core/icons'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoSrUtils(
  rawSr?: MaybeRefOrGetter<FrontXoSr | undefined>,
  rawScope: MaybeRefOrGetter<StorageScope> = { type: 'pool' }
) {
  const { t } = useI18n()

  const sr = toComputed(rawSr)
  const scope = toComputed(rawScope)

  const { getPbdsByIds, pbdsBySr } = useXoPbdCollection()
  const { getHostById } = useXoHostCollection()

  const pbdsInScope = computed(() => {
    if (sr.value === undefined) {
      return []
    }

    const pbds = getPbdsByIds(sr.value.$PBDs)

    if (scope.value.type === 'pool') {
      return pbds
    }

    const { hostId } = scope.value

    return pbds.filter(pbd => pbd.host === hostId)
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
    srStatusIcon,
    getSrLocation,
  }
}
