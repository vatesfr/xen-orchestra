import { useMapper } from '@core/packages/mapper'
import type { VIF_LOCKING_MODE } from '@vates/types/'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useVifLockingModeLabel(lockingMode: MaybeRefOrGetter<VIF_LOCKING_MODE | undefined>) {
  const { t } = useI18n()

  return useMapper<VIF_LOCKING_MODE, string>(
    lockingMode,
    {
      disabled: t('disabled'),
      locked: t('locked'),
      network_default: t('network-default'),
      unlocked: t('unlocked'),
    },
    'network_default'
  )
}
