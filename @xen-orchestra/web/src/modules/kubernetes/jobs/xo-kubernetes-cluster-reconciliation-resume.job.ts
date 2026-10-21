import { xoKubernetesClusterArg } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-args.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoKubernetesClusterReconciliationResumeJob = defineJob(
  'kubernetes-cluster.reconciliation-resume',
  [xoKubernetesClusterArg],
  () => {
    const { t } = useI18n()

    return {
      async run(cluster: XoKubernetesCluster) {
        await fetchPost(`kubernetes/clusters/${cluster.id}/reconciliation/resume`)
      },

      validate(isRunning, cluster: XoKubernetesCluster | undefined) {
        if (!cluster) {
          throw new JobError(t('job:cluster-resume-reconciliation:missing-cluster'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:cluster-resume-reconciliation:in-progress'))
        }

        if (!cluster.is_reconciliation_paused) {
          throw new JobError(t('job:cluster-resume-reconciliation:not-paused'))
        }
      },
    }
  }
)
