import type { KubernetesClusterUpgradePayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-upgrade.job.ts'
import { defineJobArg } from '@core/packages/job'

export const upgradePayloadArg = defineJobArg<KubernetesClusterUpgradePayload>({
  identify: false,
  toArray: false,
})
