import { useXoKubernetesNodeReconciliationResumeJob } from '@/modules/kubernetes/jobs/xo-kubernetes-node-reconciliation-resume.job.ts'
import { useXoKubernetesNodeCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-node-collection.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useKubernetesNodeReconciliationResume(rawNode: MaybeRefOrGetter<XoKubernetesNode>) {
  const node = toComputed(rawNode)

  const {
    run,
    canRun: canResumeReconciliation,
    isRunning: isResumingReconciliation,
  } = useXoKubernetesNodeReconciliationResumeJob(node)

  const { $context } = useXoKubernetesNodeCollection()

  async function resumeReconciliation() {
    try {
      await run()

      // TODO Remove forceReload when the collection uses events subscription instead of polling
      $context.forceReload()
    } catch (error) {
      console.error(`Failed to resume reconciliation of node ${node.value.name}:`, error)
    }
  }

  return { resumeReconciliation, canResumeReconciliation, isResumingReconciliation }
}
