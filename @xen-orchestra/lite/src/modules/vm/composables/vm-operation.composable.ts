import { isVmOperationPending } from '@/libs/vm.ts'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { CHANGING_STATE_OPERATIONS } from '@/modules/vm/utils/vm.util.ts'
import { useMapper } from '@core/packages/mapper'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export function useVmOperation(rawVm: MaybeRefOrGetter<XenApiVm | undefined>) {
  const { t } = useI18n()

  const vm = toValue(rawVm)

  const isChangingState = computed(() => {
    return vm !== undefined && isVmOperationPending(vm, CHANGING_STATE_OPERATIONS)
  })

  const currentOperation = useMapper<string, string>(
    () => Object.values(vm?.current_operations ?? {})[0],
    {
      start: t('operation:start'),
      start_on: t('operation:start-on-host'),
      pause: t('operation:pause'),
      unpause: t('operation:unpause'),
      resume: t('operation:resume'),
      suspend: t('operation:suspend'),
      clean_reboot: t('operation:clean-reboot'),
      hard_reboot: t('operation:force-reboot'),
      shutdown: t('operation:shutdown'),
      clean_shutdown: t('operation:clean-shutdown'),
      hard_shutdown: t('operation:force-shutdown'),
      snapshot: t('operation:snapshot'),
      destroy: t('operation:destroy'),
      clone: t('operation:duplicate'),
      copy: t('operation:duplicate'),
      export: t('operation:export'),
      import: t('operation:import'),
      unknown: '',
    },
    'unknown'
  )

  return {
    isChangingState,
    currentOperation,
  }
}
