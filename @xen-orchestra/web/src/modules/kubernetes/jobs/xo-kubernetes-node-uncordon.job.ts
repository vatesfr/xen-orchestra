import { xoKubernetesNodeArg } from '@/modules/kubernetes/jobs/xo-kubernetes-node-args.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoKubernetesNodeUncordonJob = defineJob('kubernetes-node.uncordon', [xoKubernetesNodeArg], () => {
  const { t } = useI18n()

  return {
    async run(node: XoKubernetesNode) {
      await fetchPost(`kubernetes/clusters/${node.$cluster}/nodes/${node.id}/uncordon`)
    },

    validate(isRunning, node: XoKubernetesNode | undefined) {
      if (!node) {
        throw new JobError(t('job:node-uncordon:missing-node'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:node-uncordon:in-progress'))
      }

      if (node.node_id === undefined) {
        throw new JobError(t('job:node-uncordon:not-registered'))
      }

      if (!node.is_cordon) {
        throw new JobError(t('job:node-uncordon:not-cordoned'))
      }

      if (node.is_draining) {
        throw new JobError(t('job:node-uncordon:draining'))
      }
    },
  }
})
