import type { DockerTreeHost } from '@/modules/docker/types/docker.type.ts'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { VM_POWER_STATE } from '@vates/types'
import { useI18n } from 'vue-i18n'

/**
 * State of a VM running an engine, without connecting: the VM, then the pooled
 * connection
 */
export function useDockerHostStatus() {
  const { t } = useI18n()

  function getDockerHostStatus({ engine, vm }: Pick<DockerTreeHost, 'engine' | 'vm'>): {
    label: string
    accent: TagAccent
  } {
    if (vm.power_state !== VM_POWER_STATE.RUNNING) {
      return { label: t('vm-not-running'), accent: 'muted' }
    }

    switch (engine.connectionStatus) {
      case 'connected':
        return { label: t('connected'), accent: 'success' }
      case 'error':
        return { label: t('error'), accent: 'danger' }
      default:
        return { label: t('docker-engine-idle'), accent: 'muted' }
    }
  }

  return { getDockerHostStatus }
}
