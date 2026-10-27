import { useXoKubernetesClusterReconciliationPauseJob } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-reconciliation-pause.job.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { isClusterReconciliationToggleable } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useKubernetesClusterReconciliationPause(rawCluster: MaybeRefOrGetter<XoKubernetesCluster>) {
  const cluster = toComputed(rawCluster)

  const { run, canRun, isRunning: isPausingReconciliation } = useXoKubernetesClusterReconciliationPauseJob(cluster)

  const canPauseReconciliation = computed(() => canRun.value && isClusterReconciliationToggleable(cluster.value))

  const { open } = useActionModal()

  function pauseReconciliation() {
    return open({
      props: {
        accent: 'warning',
        action: 'pause-reconciliation',
        object: 'kubernetes-cluster',
        clusterName: cluster.value.name,
        icon: 'status:warning-picto',
      },
      events: {
        onConfirm: async () => {
          try {
            await run()
          } catch (error) {
            console.error(`Failed to pause reconciliation of cluster ${cluster.value.name}:`, error)

            return KEEP_OVERLAY_OPEN
          }
        },
      },
    })
  }

  return { pauseReconciliation, canPauseReconciliation, isPausingReconciliation }
}
