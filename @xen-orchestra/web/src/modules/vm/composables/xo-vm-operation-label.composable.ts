import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmPendingPowerStateOperation } from '@/modules/vm/utils/xo-vm.util.ts'
import { useOperationInProgressLabel } from '@/shared/composables/operation-in-progress-label.composable.ts'
import { useI18n } from 'vue-i18n'

export function useXoVmOperationLabel() {
  const { t } = useI18n()

  const getVmOperationLabel = useOperationInProgressLabel(() => ({
    start: t('operation:start'),
    start_on: t('operation:start-on-host'),
    pause: t('operation:pause'),
    unpause: t('operation:unpause'),
    suspend: t('operation:suspend'),
    resume: t('operation:resume'),
    clean_reboot: t('operation:clean-reboot'),
    hard_reboot: t('operation:force-reboot'),
    shutdown: t('operation:shutdown'),
    clean_shutdown: t('operation:clean-shutdown'),
    hard_shutdown: t('operation:force-shutdown'),
    destroy: t('operation:destroy'),
    snapshot: t('operation:snapshot'),
    clone: t('operation:duplicate'),
    copy: t('operation:duplicate'),
    export: t('operation:export'),
    import: t('operation:import'),
    migrate_send: t('operation:migrate'),
    pool_migrate: t('operation:migrate'),
  }))

  const getVmIconTooltip = (vm: FrontXoVm | undefined) => {
    if (vm === undefined) {
      return ''
    }

    return getVmOperationLabel(getVmPendingPowerStateOperation(vm))
  }

  return { getVmOperationLabel, getVmIconTooltip }
}
