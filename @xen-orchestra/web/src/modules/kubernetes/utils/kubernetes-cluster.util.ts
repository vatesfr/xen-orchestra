import type { Status } from '@core/components/status/VtsStatus.vue'
import type { InfoAccent } from '@core/components/ui/info/UiInfo.vue'

export function kubernetesClusterPhaseToStatus(phase: string): Status {
  switch (phase.toLowerCase()) {
    case 'provisioned':
    case 'running':
      return 'ready'
    case 'provisioning':
    case 'pending':
    case 'updating':
      return 'pending'
    case 'failed':
    case 'deleted':
      return 'failure'
    case 'deleting':
      return 'disconnecting'
    case 'unknown':
      return 'skipped'
    default:
      return 'skipped'
  }
}

export function kubernetesClusterPhaseToStatusAccent(phase: string): InfoAccent {
  switch (phase.toLowerCase()) {
    case 'provisioned':
    case 'running':
      return 'success'
    case 'provisioning':
    case 'pending':
    case 'updating':
      return 'info'
    case 'failed':
    case 'deleted':
      return 'danger'
    case 'deleting':
      return 'info'
    case 'unknown':
      return 'warning'
    default:
      return 'warning'
  }
}
