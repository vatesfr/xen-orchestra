import { useXoKubernetesReleaseCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-release-collection.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { clusterVersions } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import {
  compareKubernetesVersions,
  highestKubernetesVersion,
  type KubernetesVersionOption,
  toKubernetesVersionOptions,
} from '@/modules/kubernetes/utils/kubernetes-version.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type ComputedRef, type MaybeRefOrGetter } from 'vue'

/**
 * Options of the Kubernetes version select of the upgrade form: only the releases newer than the cluster version
 * When the nodes run different versions, the highest one is used as a reference
 */
export function useKubernetesUpgradeVersionOptions(rawCluster: MaybeRefOrGetter<XoKubernetesCluster>): {
  options: ComputedRef<KubernetesVersionOption[]>
  isLoading: ComputedRef<boolean>
} {
  const cluster = toComputed(rawCluster)

  const { kubernetesReleaseGroups, areKubernetesReleasesReady } = useXoKubernetesReleaseCollection()

  const currentVersion = computed(() => highestKubernetesVersion(clusterVersions(cluster.value)))

  const options = computed(() =>
    toKubernetesVersionOptions(kubernetesReleaseGroups.value, release => {
      const version = currentVersion.value

      return version === undefined || compareKubernetesVersions(release, version) > 0
    })
  )

  return {
    options,
    isLoading: computed(() => !areKubernetesReleasesReady.value),
  }
}
