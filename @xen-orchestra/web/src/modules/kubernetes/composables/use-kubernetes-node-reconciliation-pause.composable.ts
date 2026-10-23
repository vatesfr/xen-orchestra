import { useXoKubernetesNodeReconciliationPauseJob } from '@/modules/kubernetes/jobs/xo-kubernetes-node-reconciliation-pause.job.ts'
import { useXoKubernetesNodeCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-node-collection.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useKubernetesNodeReconciliationPause(rawNode: MaybeRefOrGetter<XoKubernetesNode>) {
  const node = toComputed(rawNode)

  const {
    run,
    canRun: canPauseReconciliation,
    isRunning: isPausingReconciliation,
  } = useXoKubernetesNodeReconciliationPauseJob(node)

  const { $context } = useXoKubernetesNodeCollection()

  const { open } = useActionModal()

  function pauseReconciliation() {
    return open({
      props: {
        accent: 'warning',
        action: 'pause-reconciliation',
        object: 'kubernetes-node',
        nodeName: node.value.name,
        icon: 'status:warning-picto',
      },
      events: {
        onConfirm: async () => {
          try {
            await run()

            // TODO Remove forceReload when the collection uses events subscription instead of polling
            $context.forceReload()
          } catch (error) {
            console.error(`Failed to pause reconciliation of node ${node.value.name}:`, error)

            return KEEP_OVERLAY_OPEN
          }
        },
      },
    })
  }

  return { pauseReconciliation, canPauseReconciliation, isPausingReconciliation }
}
