import { xoKubernetesClusterArg } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-args.ts'
import { upgradePayloadArg } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-upgrade-args.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { isClusterUpgradable } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type KubernetesClusterUpgradePayload = {
  // Kubernetes release without the "v" prefix (e.g. "1.34.3")
  version: string
}

export const useXoKubernetesClusterUpgradeJob = defineJob(
  'kubernetes-cluster.upgrade',
  [xoKubernetesClusterArg, upgradePayloadArg],
  () => {
    const { t } = useI18n()

    return {
      async run(cluster: XoKubernetesCluster, payload: KubernetesClusterUpgradePayload): Promise<void> {
        await fetchPost(`kubernetes/clusters/${cluster.id}/upgrades`, payload)
      },

      // The payload is not validated: it is only set on submit, and canRun drives the upgrade button state before that
      validate(isRunning, cluster: XoKubernetesCluster | undefined) {
        if (isRunning) {
          throw new JobRunningError(t('job:upgrade:in-progress'))
        }

        if (!cluster) {
          throw new JobError(t('job:cluster-upgrade:missing-cluster'))
        }

        if (!isClusterUpgradable(cluster)) {
          throw new JobError(t('job:cluster-upgrade:not-upgradable'))
        }
      },
    }
  }
)
