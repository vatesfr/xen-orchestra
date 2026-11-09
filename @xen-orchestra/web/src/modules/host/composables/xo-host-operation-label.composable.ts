import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostPendingStateOperation } from '@/modules/host/utils/xo-host.util.ts'
import { useOperationInProgressLabel } from '@/shared/composables/operation-in-progress-label.composable.ts'
import { useI18n } from 'vue-i18n'

export function useXoHostOperationLabel() {
  const { t } = useI18n()

  const getHostOperationLabel = useOperationInProgressLabel(() => ({
    power_on: t('operation:start'),
    shutdown: t('operation:shutdown'),
    reboot: t('operation:clean-reboot'),
    evacuate: t('operation:evacuate'),
    enable: t('operation:enable'),
    suspend: t('operation:vm-suspend'),
    clean_shutdown: t('operation:vm-clean-shutdown'),
    hard_shutdown: t('operation:vm-hard-shutdown'),
  }))

  const getHostIconTooltip = (host: FrontXoHost | undefined) => {
    if (host === undefined) {
      return ''
    }

    return getHostOperationLabel(getHostPendingStateOperation(host))
  }

  return { getHostOperationLabel, getHostIconTooltip }
}
