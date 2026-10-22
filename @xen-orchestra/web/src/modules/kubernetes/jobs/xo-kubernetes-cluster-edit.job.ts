import { xoKubernetesClusterArg } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-args.ts'
import { editPayloadArg } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-edit-args.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { getClusterUpdates } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import { fetchPut } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type KubernetesClusterEditPayload = {
  description: string
  control_plane_replicas: number
  worker_replicas: number
}

export const useXoKubernetesClusterEditJob = defineJob(
  'kubernetes-cluster.edit',
  [xoKubernetesClusterArg, editPayloadArg],
  () => {
    const { t } = useI18n()

    return {
      async run(cluster: XoKubernetesCluster, payload: KubernetesClusterEditPayload): Promise<void> {
        const updates = getClusterUpdates(cluster, payload)

        const results = await Promise.allSettled(updates.map(({ endpoint, body }) => fetchPut(endpoint, body)))

        const errors = results.flatMap((result, index) => {
          if (result.status === 'fulfilled') {
            return []
          }

          console.error(`Failed to update ${updates[index]?.endpoint} of cluster ${cluster.name}:`, result.reason)

          return [result.reason]
        })

        if (errors.length === 1) {
          throw errors[0]
        }

        if (errors.length > 1) {
          throw new AggregateError(errors, `Failed to edit cluster ${cluster.name}`)
        }
      },

      // The payload is not validated: it is only set on submit, and canRun drives the edit button state before that
      validate(isRunning, cluster: XoKubernetesCluster | undefined) {
        if (isRunning) {
          throw new JobRunningError(t('job:edit:in-progress'))
        }

        if (!cluster) {
          throw new JobError(t('job:cluster-edit:missing-cluster'))
        }
      },
    }
  }
)
