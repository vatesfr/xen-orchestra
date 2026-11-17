import { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import type { IconName } from '@core/icons'
import { useMapper } from '@core/packages/mapper'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useVmUtils(rawVm: MaybeRefOrGetter<XenApiVm>) {
  const { t } = useI18n()

  const vm = toComputed(rawVm)

  const powerState = useMapper<VM_POWER_STATE, { icon: IconName; text: string }>(
    () => vm.value.power_state,
    () => ({
      [VM_POWER_STATE.RUNNING]: { icon: 'status:running-circle', text: t('vm:status:running') },
      [VM_POWER_STATE.HALTED]: { icon: 'status:halted-circle', text: t('vm:status:halted') },
      [VM_POWER_STATE.PAUSED]: { icon: 'status:paused-circle', text: t('vm:status:paused') },
      [VM_POWER_STATE.SUSPENDED]: { icon: 'status:suspended-circle', text: t('vm:status:suspended') },
    }),
    VM_POWER_STATE.RUNNING
  )

  return {
    powerState,
  }
}
