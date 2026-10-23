import { useXoKubernetesClusterUpgradeJob } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-upgrade.job.ts'
import type { KubernetesClusterUpgradePayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-upgrade.job.ts'
import { useXoKubernetesClusterCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-cluster-collection.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useKubernetesClusterUpgrade(rawCluster: MaybeRefOrGetter<XoKubernetesCluster>) {
  const cluster = toComputed(rawCluster)

  const payload = ref<KubernetesClusterUpgradePayload>()

  const {
    run,
    canRun: canUpgradeCluster,
    isRunning: isUpgradingCluster,
  } = useXoKubernetesClusterUpgradeJob(cluster, payload)

  const { $context } = useXoKubernetesClusterCollection()

  const { open } = useOverlay({
    component: () => import('@/modules/kubernetes/components/drawer/UpgradeClusterDrawer.vue'),
    events: {
      onConfirm: async (upgradePayload: KubernetesClusterUpgradePayload) => {
        payload.value = upgradePayload

        try {
          await run()

          // TODO Remove forceReload when the collection uses events subscription instead of polling
          $context.forceReload()
        } catch (error) {
          console.error(`Failed to upgrade cluster ${cluster.value.name}:`, error)

          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    cluster: cluster.value,
  }))

  function upgradeCluster() {
    return open({ props })
  }

  return { upgradeCluster, canUpgradeCluster, isUpgradingCluster }
}
