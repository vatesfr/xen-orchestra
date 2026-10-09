import { useXoKubernetesClusterCreateJob } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-create.job.ts'
import type { KubernetesClusterCreatePayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-create.job.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

export function useCreateKubernetesClusterDrawer() {
  const payload = ref<KubernetesClusterCreatePayload>()

  const { run, isRunning } = useXoKubernetesClusterCreateJob(payload)

  const { open: openDrawer } = useOverlay({
    component: () => import('@/modules/kubernetes/components/drawer/CreateClusterDrawer.vue'),
    events: {
      onConfirm: async (createPayload: KubernetesClusterCreatePayload) => {
        payload.value = createPayload

        try {
          await run()
        } catch (error) {
          console.error(`Failed to create cluster ${createPayload.name}:`, error)

          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  return { openDrawer, isRunning }
}
