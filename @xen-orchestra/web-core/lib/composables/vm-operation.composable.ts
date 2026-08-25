import { useMapper } from '@core/packages/mapper'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export const CHANGING_STATE_OPERATIONS = [
  'start',
  'start_on',
  'pause',
  'unpause',
  'resume',
  'suspend',
  'clean_reboot',
  'hard_reboot',
  'shutdown',
  'clean_shutdown',
  'hard_shutdown',
  'snapshot',
  'destroy',
  'clone',
  'copy',
  'export',
  'import',
]

type VmWithOperations = {
  current_operations: Record<string, string>
}

export function useVmOperation(vm: MaybeRefOrGetter<VmWithOperations | undefined>) {
  const { t } = useI18n()

  const currentOperations = computed(() => Object.values(toValue(vm)?.current_operations ?? {}))

  const isChangingState = computed(() =>
    currentOperations.value.some(operation => CHANGING_STATE_OPERATIONS.includes(operation))
  )

  const currentOperation = useMapper<string, string>(
    () => currentOperations.value[0],
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
