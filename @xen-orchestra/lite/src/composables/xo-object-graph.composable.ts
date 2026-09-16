// POC — feeds XO Lite's records to xo-server's xapi-object-to-xo.
//
// The transform expects xen-api's enriched objects, not raw records. Lite keeps
// raw records in per-type Pinia stores, so this composable federates the stores
// the VM path touches into the single `{ ref -> record }` registry that the
// ported `_wrapRecord` needs, then re-wraps everything.
//
// Rebuilt whenever any of the underlying stores changes. That is fine for a
// POC and obviously not fine for production — see the write-up.

import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { useNetworkStore } from '@/stores/xen-api/network.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import { useSrStore } from '@/stores/xen-api/sr.store.ts'
import { useVbdStore } from '@/stores/xen-api/vbd.store.ts'
import { useVdiStore } from '@/stores/xen-api/vdi.store.ts'
import { useVifStore } from '@/stores/xen-api/vif.store.ts'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store.ts'
import { useVmMetricsStore } from '@/stores/xen-api/vm-metrics.store.ts'
import { useVmRawStore } from '@/stores/xen-api/vm-raw.store.ts'
import { useVtpmStore } from '@/stores/xen-api/vtpm.store.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { xapiObjectToXo } from '@xen-orchestra/xapi-object-to-xo'
import { createXapiGraph } from '@xen-orchestra/xapi-object-to-xo/browser'
import { computed } from 'vue'

export function useXoObjectGraph() {
  const xenApiStore = useXenApiStore()

  // The XAPI type name each store holds, as the transform expects it
  // (`TRANSFORMS` is keyed on a lowercased `$type`).
  const sources = {
    pool: usePoolStore().subscribe(),
    host: useHostStore().subscribe(),
    host_metrics: useHostMetricsStore().subscribe(),
    vm: useVmRawStore().subscribe(),
    vm_metrics: useVmMetricsStore().subscribe(),
    vm_guest_metrics: useVmGuestMetricsStore().subscribe(),
    vbd: useVbdStore().subscribe(),
    vdi: useVdiStore().subscribe(),
    sr: useSrStore().subscribe(),
    vif: useVifStore().subscribe(),
    network: useNetworkStore().subscribe(),
    vtpm: useVtpmStore().subscribe(),
  }

  const isReady = computed(() => Object.values(sources).every(source => source.isReady.value))

  const graph = computed(() => {
    const recordsByType: Record<string, Record<string, Record<string, unknown>>> = {}

    for (const [type, source] of Object.entries(sources)) {
      const byRef: Record<string, Record<string, unknown>> = {}

      for (const record of source.records.value) {
        byRef[record.$ref] = record as unknown as Record<string, unknown>
      }

      recordsByType[type] = byRef
    }

    return createXapiGraph({
      recordsByType,
      call: (method, ...args) => xenApiStore.getXapi().call(method, args),
    })
  })

  const getXapiObject = (opaqueRef: string) => graph.value.getObjectByRef(opaqueRef)

  const getXoObject = (opaqueRef: string) => {
    const xapiObject = graph.value.getObjectByRef(opaqueRef)

    return xapiObject === undefined ? undefined : xapiObjectToXo(xapiObject)
  }

  return { isReady, getXapiObject, getXoObject, graph }
}
