import { useXoKubernetesNodeCordonJob } from '@/modules/kubernetes/jobs/xo-kubernetes-node-cordon.job.ts'
import { useXoKubernetesNodeCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-node-collection.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useKubernetesNodeCordon(rawNode: MaybeRefOrGetter<XoKubernetesNode>) {
  const node = toComputed(rawNode)

  const { run, canRun: canCordonNode, isRunning: isCordoningNode } = useXoKubernetesNodeCordonJob(node)

  const { $context } = useXoKubernetesNodeCollection()

  async function cordonNode() {
    try {
      await run()

      // TODO: remove forceReload when CAPI emits a node event on cordon/uncordon/drain (only the Machine changes are streamed for now)
      await $context.forceReload()
    } catch (error) {
      console.error(`Failed to cordon node ${node.value.name}:`, error)
    }
  }

  return { cordonNode, canCordonNode, isCordoningNode }
}
