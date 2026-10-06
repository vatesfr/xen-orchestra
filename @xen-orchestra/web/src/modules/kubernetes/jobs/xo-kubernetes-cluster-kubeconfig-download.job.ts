import { xoKubernetesClusterArg } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-args.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { fetchRequest } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { downloadFile } from '@core/utils/download-file.utils.ts'
import { useI18n } from 'vue-i18n'

export const useXoKubernetesClusterKubeconfigDownloadJob = defineJob(
  'kubernetes-cluster.kubeconfig-download',
  [xoKubernetesClusterArg],
  () => {
    const { t } = useI18n()

    return {
      async run(cluster: XoKubernetesCluster) {
        const { kubeconfig } = await fetchRequest<{ kubeconfig: string }>(`kubernetes/clusters/${cluster.id}/config`)

        const url = URL.createObjectURL(new Blob([kubeconfig], { type: 'application/yaml' }))

        downloadFile(url, `${cluster.name}-kubeconfig.yaml`, false)
        URL.revokeObjectURL(url)
      },

      validate(isRunning, cluster: XoKubernetesCluster | undefined) {
        if (!cluster) {
          throw new JobError(t('job:cluster-kubeconfig-download:missing-cluster'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:download:in-progress'))
        }
      },
    }
  }
)
