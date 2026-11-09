import type { PropertyDefinition } from '@core/packages/query-builder/types.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { VM_POWER_STATE } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useVmPowerStateSchema(): PropertyDefinition {
  const { t } = useI18n()

  return useStringSchema(t('power-state'), {
    [VM_POWER_STATE.RUNNING]: t('status:running'),
    [VM_POWER_STATE.HALTED]: t('status:halted'),
    [VM_POWER_STATE.SUSPENDED]: t('status:suspended'),
    [VM_POWER_STATE.PAUSED]: t('status:paused'),
  })
}
