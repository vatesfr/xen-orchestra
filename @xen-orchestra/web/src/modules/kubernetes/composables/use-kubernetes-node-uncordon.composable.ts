import { useXoKubernetesNodeUncordonJob } from '@/modules/kubernetes/jobs/xo-kubernetes-node-uncordon.job.ts'
import { useXoKubernetesNodeCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-node-collection.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useKubernetesNodeUncordon(rawNode: MaybeRefOrGetter<XoKubernetesNode>) {
  const node = toComputed(rawNode)

  const { run, canRun: canUncordonNode, isRunning: isUncordoningNode } = useXoKubernetesNodeUncordonJob(node)

  const { $context } = useXoKubernetesNodeCollection()

  async function uncordonNode() {
    try {
      await run()

      // TODO Remove forceReload when the collection uses events subscription instead of polling
      $context.forceReload()
    } catch (error) {
      console.error(`Failed to uncordon node ${node.value.name}:`, error)
    }
  }

  return { uncordonNode, canUncordonNode, isUncordoningNode }
}
