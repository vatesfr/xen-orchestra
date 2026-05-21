import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdUtils } from '@/modules/pbd/composables/xo-pbd-utils.composable.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { type IconName, objectIcon } from '@core/icons'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoSrUtils(rawSr: MaybeRefOrGetter<FrontXoSr | undefined>) {
  const sr = toComputed(rawSr)

  const { getPbdsByIds } = useXoPbdCollection()

  const { allPbdsConnectionStatus } = useXoPbdUtils(() => getPbdsByIds(sr.value?.$PBDs ?? []))

  const srStatusIcon = computed<IconName>(() => objectIcon('sr', allPbdsConnectionStatus.value))

  return {
    srStatusIcon,
  }
}

export function useGetSrLocation() {
  const { t } = useI18n()
  const { pbdsBySr } = useXoPbdCollection()
  const { getHostById } = useXoHostCollection()

  return function getSrLocation(sr: FrontXoSr): string {
    if (sr.shared) {
      return t('shared')
    }

    const hostName = pbdsBySr.value
      .get(sr.id)
      ?.map(pbd => getHostById(pbd.host)?.name_label)
      .find(name => name !== undefined)

    return hostName ?? t('unknown')
  }
}
