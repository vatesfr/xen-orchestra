import { xoKubernetesNodeArg } from '@/modules/kubernetes/jobs/xo-kubernetes-node-args.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoKubernetesNodeDrainJob = defineJob('kubernetes-node.drain', [xoKubernetesNodeArg], () => {
  const { t } = useI18n()

  return {
    async run(node: XoKubernetesNode) {
      await fetchPost(`kubernetes/clusters/${node.$cluster}/nodes/${node.id}/drain`, {})
    },

    validate(isRunning, node: XoKubernetesNode | undefined) {
      if (!node) {
        throw new JobError(t('job:node-drain:missing-node'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:node-drain:in-progress'))
      }

      if (node.node_name === undefined) {
        throw new JobError(t('job:node-drain:not-registered'))
      }

      if (node.is_draining) {
        throw new JobError(t('job:node-drain:already-draining'))
      }
    },
  }
})
