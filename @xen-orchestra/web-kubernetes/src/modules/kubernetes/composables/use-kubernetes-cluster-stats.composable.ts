import { useXoKubernetesNodeCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-node-collection.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { VM_POWER_STATE } from '@vates/types'
import type { XapiVmStats } from '@vates/types/common'
import { useAsyncState, useIntervalFn } from '@vueuse/core'
import {
  fetchGet,
  type FrontXoVm,
  GRANULARITY,
  RRD_STEP_FROM_STRING,
  useXoVmCollection,
} from '@xen-orchestra/web/ui-plugin-sdk'
import { computed, type MaybeRefOrGetter, watch } from 'vue'

export function useKubernetesClusterStats(rawCluster: MaybeRefOrGetter<XoKubernetesCluster>) {
  const cluster = toComputed(rawCluster)

  const { nodesByCluster, areNodesReady } = useXoKubernetesNodeCollection()

  const { getVmById, areVmsReady } = useXoVmCollection()

  const nodes = computed(() => nodesByCluster.value.get(cluster.value.id) ?? [])

  // VMs from a disconnected pool, not visible to the user, or halted can't provide stats
  const runningVmIds = computed(() =>
    nodes.value
      .map(node => getVmById(node.vm_id))
      .filter((vm): vm is FrontXoVm => vm?.power_state === VM_POWER_STATE.RUNNING)
      .map(vm => vm.id)
  )

  const { state, isLoading, execute } = useAsyncState(
    () =>
      Promise.allSettled(
        runningVmIds.value.map(vmId => fetchGet<XapiVmStats>(`vms/${vmId}/stats?granularity=${GRANULARITY.Hours}`))
      ),
    [],
    { immediate: false, resetOnExecute: false }
  )

  useIntervalFn(() => execute(), RRD_STEP_FROM_STRING[GRANULARITY.Hours] * 1000)

  watch(
    () => runningVmIds.value.join(),
    () => execute(),
    { immediate: true }
  )

  const vmsStats = computed(() =>
    state.value.filter(result => result.status === 'fulfilled').map(result => result.value)
  )

  const excludedNodeCount = computed(() => nodes.value.length - vmsStats.value.length)

  const hasError = computed(() => state.value.length > 0 && vmsStats.value.length === 0)

  const isFetching = computed(() => !areNodesReady.value || !areVmsReady.value || isLoading.value)

  return {
    vmsStats,
    excludedNodeCount,
    hasError,
    isFetching,
  }
}
