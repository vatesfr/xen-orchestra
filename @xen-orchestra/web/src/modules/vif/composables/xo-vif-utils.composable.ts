import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useMapper } from '@core/packages/mapper'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { VIF_LOCKING_MODE } from '@vates/types'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoVifUtils(rawVif: MaybeRefOrGetter<FrontXoVif>) {
  const { t } = useI18n()

  const vif = toComputed(rawVif)

  const lockingModeLabel = useMapper(
    () => vif.value.lockingMode,
    {
      [VIF_LOCKING_MODE.DISABLED]: t('disabled'),
      [VIF_LOCKING_MODE.LOCKED]: t('locked'),
      [VIF_LOCKING_MODE.NETWORK_DEFAULT]: t('network-default'),
      [VIF_LOCKING_MODE.UNLOCKED]: t('unlocked'),
    },
    VIF_LOCKING_MODE.NETWORK_DEFAULT
  )

  return {
    lockingModeLabel,
  }
}
