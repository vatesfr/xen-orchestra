import { useXoKubernetesClusterEditJob } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-edit.job.ts'
import type { KubernetesClusterEditPayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-edit.job.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { isClusterEditable } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

export function useKubernetesClusterEdit(rawCluster: MaybeRefOrGetter<XoKubernetesCluster>) {
  const cluster = toComputed(rawCluster)

  const payload = ref<KubernetesClusterEditPayload>()

  const { run, canRun, isRunning: isEditingCluster } = useXoKubernetesClusterEditJob(cluster, payload)

  const canEditCluster = computed(() => canRun.value && isClusterEditable(cluster.value.phase))

  const { open } = useOverlay({
    component: () => import('@/modules/kubernetes/components/drawer/CreateClusterDrawer.vue'),
    events: {
      onEdit: async (editPayload: KubernetesClusterEditPayload) => {
        payload.value = editPayload

        try {
          await run()
        } catch (error) {
          console.error(`Failed to edit cluster ${cluster.value.name}:`, error)

          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    cluster: cluster.value,
  }))

  function editCluster() {
    return open({ props })
  }

  return { editCluster, canEditCluster, isEditingCluster }
}
