import { isVmOperationPending } from '@/libs/vm.ts'
import { VM_OPERATION } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { CHANGING_STATE_OPERATIONS } from '@/modules/vm/utils/vm.util.ts'
import { useMapper } from '@core/packages/mapper'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export function useVmUtils(rawVm: MaybeRefOrGetter<XenApiVm | undefined>) {
  const { t } = useI18n()

  const vm = computed(() => toValue(rawVm))

  const isChangingState = computed(
    () => vm.value !== undefined && isVmOperationPending(vm.value, CHANGING_STATE_OPERATIONS)
  )

  const currentOperation = useMapper<string, string>(
    () => Object.values(vm.value?.current_operations ?? {})[0],
    {
      [VM_OPERATION.START]: t('operation:start'),
      [VM_OPERATION.START_ON]: t('operation:start-on-host'),
      [VM_OPERATION.PAUSE]: t('operation:pause'),
      [VM_OPERATION.UNPAUSE]: t('operation:unpause'),
      [VM_OPERATION.RESUME]: t('operation:resume'),
      [VM_OPERATION.SUSPEND]: t('operation:suspend'),
      [VM_OPERATION.CLEAN_REBOOT]: t('operation:clean-reboot'),
      [VM_OPERATION.HARD_REBOOT]: t('operation:force-reboot'),
      [VM_OPERATION.SHUTDOWN]: t('operation:shutdown'),
      [VM_OPERATION.CLEAN_SHUTDOWN]: t('operation:clean-shutdown'),
      [VM_OPERATION.HARD_SHUTDOWN]: t('operation:force-shutdown'),
      [VM_OPERATION.SNAPSHOT]: t('operation:snapshot'),
      [VM_OPERATION.DESTROY]: t('operation:destroy'),
      [VM_OPERATION.CLONE]: t('operation:duplicate'),
      [VM_OPERATION.COPY]: t('operation:duplicate'),
      [VM_OPERATION.EXPORT]: t('operation:export'),
      [VM_OPERATION.IMPORT]: t('operation:import'),
      unknown: '',
    },
    'unknown'
  )

  return {
    isChangingState,
    currentOperation,
  }
}
