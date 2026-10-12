import { useXoKubernetesClusterKubeconfigDownloadJob } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-kubeconfig-download.job.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { isClusterPhaseReady } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useKubernetesClusterKubeconfigDownload(rawCluster: MaybeRefOrGetter<XoKubernetesCluster>) {
  const cluster = toComputed(rawCluster)

  const { run, canRun, isRunning: isDownloadingKubeconfig } = useXoKubernetesClusterKubeconfigDownloadJob(cluster)

  const canDownloadKubeconfig = computed(() => canRun.value && isClusterPhaseReady(cluster.value.phase))

  async function downloadKubeconfig() {
    try {
      await run()
    } catch (error) {
      console.error('Error when downloading cluster kubeconfig:', error)
    }
  }

  return { downloadKubeconfig, canDownloadKubeconfig, isDownloadingKubeconfig }
}
