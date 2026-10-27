import { useXoKubernetesNodeCordonJob } from '@/modules/kubernetes/jobs/xo-kubernetes-node-cordon.job.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useKubernetesNodeCordon(rawNode: MaybeRefOrGetter<XoKubernetesNode>) {
  const node = toComputed(rawNode)

  const { run, canRun: canCordonNode, isRunning: isCordoningNode } = useXoKubernetesNodeCordonJob(node)

  async function cordonNode() {
    try {
      await run()
    } catch (error) {
      console.error(`Failed to cordon node ${node.value.name}:`, error)
    }
  }

  return { cordonNode, canCordonNode, isCordoningNode }
}
