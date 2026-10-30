import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { useVifLockingModeLabel } from '@core/utils/vif.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useXoVifUtils(rawVif: MaybeRefOrGetter<FrontXoVif>) {
  const vif = toComputed(rawVif)

  const lockingModeLabel = useVifLockingModeLabel(() => vif.value.lockingMode)

  return {
    lockingModeLabel,
  }
}
