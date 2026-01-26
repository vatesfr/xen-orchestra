import { useXoPbdUtils } from '@/composables/xo-pbd-utils.composable.ts'
import { useXoPbdCollection } from '@/remote-resources/use-xo-pbd-collection.ts'
import type { IconName } from '@core/icons/index.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoSr } from '@vates/types'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useXoSrUtils(rawSr: MaybeRefOrGetter<XoSr>) {
  const sr = toComputed(rawSr)

  const { getPbdsByIds } = useXoPbdCollection()

  const { allPbdsConnectionStatus } = useXoPbdUtils(() => getPbdsByIds(sr.value.$PBDs))

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
