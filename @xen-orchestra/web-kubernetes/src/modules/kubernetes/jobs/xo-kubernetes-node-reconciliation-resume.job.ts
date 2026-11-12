import { xoKubernetesNodeArg } from '@/modules/kubernetes/jobs/xo-kubernetes-node-args.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoKubernetesNodeReconciliationResumeJob = defineJob(
  'kubernetes-node.reconciliation-resume',
  [xoKubernetesNodeArg],
  () => {
    const { t } = useI18n()

    return {
      async run(node: XoKubernetesNode) {
        await fetchPost(`kubernetes/clusters/${node.$cluster}/nodes/${node.id}/reconciliation/resume`)
      },

      validate(isRunning, node: XoKubernetesNode | undefined) {
        if (!node) {
          throw new JobError(t('job:node-resume-reconciliation:missing-node'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:node-resume-reconciliation:in-progress'))
        }

        if (!node.is_reconciliation_paused) {
          throw new JobError(t('job:node-resume-reconciliation:not-paused'))
        }
      },
    }
  }
)
