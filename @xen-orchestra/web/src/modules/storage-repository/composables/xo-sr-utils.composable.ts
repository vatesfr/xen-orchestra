import { useXoPbdUtils } from '@/modules/pbd/composables/xo-pbd-utils.composable.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { type IconName, objectIcon } from '@core/icons'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useXoSrUtils(rawSr: MaybeRefOrGetter<FrontXoSr | undefined>) {
  const sr = toComputed(rawSr)

  const { getPbdsByIds } = useXoPbdCollection()

  const { allPbdsConnectionStatus } = useXoPbdUtils(() => getPbdsByIds(sr.value?.$PBDs ?? []))

  const srStatusIcon = computed<IconName>(() => objectIcon('sr', allPbdsConnectionStatus.value))

  return {
    srStatusIcon,
  }
}
