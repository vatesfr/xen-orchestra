import { useXoKubernetesNodeDrainJob } from '@/modules/kubernetes/jobs/xo-kubernetes-node-drain.job.ts'
import { useXoKubernetesNodeCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-node-collection.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useKubernetesNodeDrain(rawNode: MaybeRefOrGetter<XoKubernetesNode>) {
  const node = toComputed(rawNode)

  const { run, canRun: canDrainNode, isRunning: isDrainingNode } = useXoKubernetesNodeDrainJob(node)

  const { $context } = useXoKubernetesNodeCollection()

  async function drainNode() {
    try {
      await run()

      // TODO Remove forceReload when the collection uses events subscription instead of polling
      $context.forceReload()
    } catch (error) {
      console.error(`Failed to drain node ${node.value.name}:`, error)
    }
  }

  return { drainNode, canDrainNode, isDrainingNode }
}
