import { useXoKubernetesReleaseCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-release-collection.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { clusterVersion } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import {
  type KubernetesVersionOption,
  toKubernetesVersionOptions,
} from '@/modules/kubernetes/utils/kubernetes-version.util.ts'
import { computed, type ComputedRef } from 'vue'

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

  const options = computed(() => toKubernetesVersionOptions(kubernetesReleaseGroups.value))

  return {
    options,
    // The newest release
    defaultOption: computed(() => options.value[0]),
    isLoading: computed(() => !areKubernetesReleasesReady.value),
  }
}
