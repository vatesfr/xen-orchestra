import { useMapper } from '@core/packages/mapper'
import { VIF_LOCKING_MODE } from '@vates/types'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useVifLockingModeLabel(lockingMode: MaybeRefOrGetter<VIF_LOCKING_MODE | undefined>) {
  const { t } = useI18n()

  return useMapper<VIF_LOCKING_MODE, string>(
    lockingMode,
    {
      [VIF_LOCKING_MODE.DISABLED]: t('disabled'),
      [VIF_LOCKING_MODE.LOCKED]: t('locked'),
      [VIF_LOCKING_MODE.NETWORK_DEFAULT]: t('network-default'),
      [VIF_LOCKING_MODE.UNLOCKED]: t('unlocked'),
    },
    VIF_LOCKING_MODE.NETWORK_DEFAULT
  )
}
