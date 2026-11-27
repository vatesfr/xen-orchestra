import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { getVmVcpus } from '@/modules/vm/utils/vm.util.ts'
import { useVbdStore } from '@/stores/xen-api/vbd.store.ts'
import { useVdiStore } from '@/stores/xen-api/vdi.store.ts'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store.ts'
import { useVmMetricsStore } from '@/stores/xen-api/vm-metrics.store.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useVmResources(rawVm: MaybeRefOrGetter<XenApiVm>) {
  const vm = toComputed(rawVm)

  const { getByOpaqueRef: getVmMetrics } = useVmMetricsStore().subscribe()
  const { getByOpaqueRef: getGuestMetrics } = useVmGuestMetricsStore().subscribe()
  const { getByOpaqueRefs: getVbds } = useVbdStore().subscribe()
  const { getByOpaqueRefs: getVdis } = useVdiStore().subscribe()

  const vcpus = computed(() =>
    getVmVcpus(vm.value, getVmMetrics(vm.value.metrics), getGuestMetrics(vm.value.guest_metrics))
  )

  const vdis = computed(() =>
    getVdis(
      getVbds(vm.value.VBDs)
        .filter(vbd => vbd.type === 'Disk')
        .map(vbd => vbd.VDI)
    )
  )

  const diskSize = computed(() => vdis.value.reduce((total, vdi) => total + (vdi.virtual_size ?? 0), 0))

  return {
    vcpus,
    vdis,
    diskSize,
  }
}
