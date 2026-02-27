import { useXoPbdUtils } from '@/modules/pbd/composables/xo-pbd-utils.composable.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { IconName } from '@core/icons'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useXoSrUtils(rawSr: MaybeRefOrGetter<FrontXoSr>) {
  const sr = toComputed(rawSr)

  const { getPbdsByIds } = useXoPbdCollection()

  const { allPbdsConnectionStatus } = useXoPbdUtils(() => getPbdsByIds(sr.value?.$PBDs))

  const srStatusIcon = computed<IconName>(() => {
    if (allPbdsConnectionStatus.value === 'connected') {
      return 'object:sr:connected'
    }

    if (allPbdsConnectionStatus.value === 'partially-connected') {
      return 'object:sr:partially-connected'
    }

    return 'object:sr:disconnected'
  })

  return {
    srStatusIcon,
  }
}
