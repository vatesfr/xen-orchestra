import { useXoKubernetesReleaseCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-release-collection.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { clusterVersion } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import { computed, type ComputedRef } from 'vue'

export type KubernetesVersionOption = {
  value: string
  label: string
  // Minor version the release belongs to, displayed as a separator in the select dropdown
  group?: string
}

/**
 * Options of the Kubernetes version select.
 * When a cluster is provided (edit mode), the only option is its current version and the available releases are not
 * fetched: the version can't be updated and the current one may not be available anymore.
 */
export function useKubernetesVersionOptions(cluster?: XoKubernetesCluster): {
  options: ComputedRef<KubernetesVersionOption[]>
  defaultOption: ComputedRef<KubernetesVersionOption | undefined>
  isLoading: ComputedRef<boolean>
} {
  if (cluster !== undefined) {
    const version = clusterVersion(cluster)

    return {
      options: computed(() => [{ value: version, label: version }]),
      defaultOption: computed(() => undefined),
      isLoading: computed(() => false),
    }
  }

  const { kubernetesReleaseGroups, areKubernetesReleasesReady } = useXoKubernetesReleaseCollection()

  // CAPI expects releases without the "v" prefix, which is only added for display
  const options = computed(() =>
    kubernetesReleaseGroups.value.flatMap(({ version, releases }) =>
      releases.map(release => ({ value: release, label: `v${release}`, group: `v${version}` }))
    )
  )

  return {
    options,
    // The newest release
    defaultOption: computed(() => options.value[0]),
    isLoading: computed(() => !areKubernetesReleasesReady.value),
  }
}
