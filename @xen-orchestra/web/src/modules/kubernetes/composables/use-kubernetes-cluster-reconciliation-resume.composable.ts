import { useXoKubernetesClusterReconciliationResumeJob } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-reconciliation-resume.job.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { isClusterReconciliationToggleable } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useKubernetesClusterReconciliationResume(rawCluster: MaybeRefOrGetter<XoKubernetesCluster>) {
  const cluster = toComputed(rawCluster)

  const { run, canRun, isRunning: isResumingReconciliation } = useXoKubernetesClusterReconciliationResumeJob(cluster)

  const canResumeReconciliation = computed(() => canRun.value && isClusterReconciliationToggleable(cluster.value.phase))

  async function resumeReconciliation() {
    try {
      await run()
    } catch (error) {
      console.error(`Failed to resume reconciliation of cluster ${cluster.value.name}:`, error)
    }
  }

  return { resumeReconciliation, canResumeReconciliation, isResumingReconciliation }
}
