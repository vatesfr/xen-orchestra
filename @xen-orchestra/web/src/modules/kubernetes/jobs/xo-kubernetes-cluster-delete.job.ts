import { xoKubernetesClustersArg } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-args.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoKubernetesClusterDeleteJob = defineJob('kubernetes-cluster.delete', [xoKubernetesClustersArg], () => {
  const { t } = useI18n()

  return {
    async run(clusters: XoKubernetesCluster[]) {
      const results = await Promise.allSettled(
        clusters.map(cluster => fetchDelete(`kubernetes/clusters/${cluster.id}`))
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to delete cluster ${clusters[index]?.name}:`, result.reason)
        }
      })

      return results
    },

    validate(isRunning, clusters: XoKubernetesCluster[] | undefined) {
      if (!clusters || clusters.length === 0) {
        throw new JobError(t('job:cluster-delete:missing-cluster'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }
    },
  }
})
