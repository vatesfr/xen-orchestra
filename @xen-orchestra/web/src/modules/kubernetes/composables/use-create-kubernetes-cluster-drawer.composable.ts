import { useXoKubernetesClusterCreateJob } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-create.job.ts'
import type { KubernetesClusterCreatePayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-create.job.ts'
import { useXoKubernetesClusterCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-cluster-collection.ts'
import { useXoCurrentUserResource } from '@/modules/user/remote-resources/use-xo-current-user.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

export function useCreateKubernetesClusterDrawer() {
  const payload = ref<KubernetesClusterCreatePayload>()

  const { run, isRunning } = useXoKubernetesClusterCreateJob(payload)

  const { $context } = useXoKubernetesClusterCollection()

  const { currentUser } = useXoCurrentUserResource()

  const { open: openDrawer } = useOverlay({
    component: () => import('@/modules/kubernetes/components/drawer/CreateClusterDrawer.vue'),
    events: {
      onConfirm: async (createPayload: KubernetesClusterCreatePayload) => {
        // TODO : created_by_xo_user_id should be passed at REST API level, not frontend
        payload.value = { ...createPayload, created_by_xo_user_id: currentUser.value?.id }

        try {
          await run()

          // TODO Remove forceReload when the collection uses events subscription instead of polling
          $context.forceReload()
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
