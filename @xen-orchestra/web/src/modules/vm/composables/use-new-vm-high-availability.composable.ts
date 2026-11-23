import type { VmState } from '@/modules/vm/types/new-xo-vm.type.ts'
import { useMapper } from '@core/packages/mapper'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

type HighAvailability = VmState['highAvailability']

const HA_OPTIONS: HighAvailability[] = ['', 'restart', 'best-effort']

export function useNewVmHighAvailability(highAvailability: MaybeRefOrGetter<HighAvailability>) {
  const { t } = useI18n()

  const haLabels: Record<HighAvailability, string> = {
    '': t('new-vm:ha-disabled'),
    restart: t('new-vm:ha-restart'),
    'best-effort': t('new-vm:ha-best-effort'),
  }

  const getHaLabel = (value: HighAvailability) => haLabels[value]

  const haDescription = useMapper<HighAvailability, string>(
    highAvailability,
    {
      '': t('new-vm:ha-disabled-description'),
      restart: t('new-vm:ha-restart-description'),
      'best-effort': t('new-vm:ha-best-effort-description'),
    },
    ''
  )

  return {
    haOptions: HA_OPTIONS,
    getHaLabel,
    haDescription,
  }
}
