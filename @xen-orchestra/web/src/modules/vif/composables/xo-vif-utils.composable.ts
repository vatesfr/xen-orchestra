import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useVifLockingModeLabel } from '@core/composables/vif-locking-mode-label.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useXoVifUtils(rawVif: MaybeRefOrGetter<FrontXoVif>) {
  const vif = toComputed(rawVif)

  const lockingModeLabel = useVifLockingModeLabel(() => vif.value.lockingMode)

  return {
    lockingModeLabel,
  }
}
