// POC — feeds XO Lite's records to xapi-object-to-xo, following the
// performance rules of the migration plan: one lookup kept up to date from
// XAPI events, translation on first read, and only the changed record plus
// its dependents forgotten on each change.

import type { ObjectType, RecordRef, XenApiRecord } from '@/libs/xen-api/xen-api.types.ts'
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
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { type XoObjectOf, xapiObjectToXo } from '@xen-orchestra/xapi-object-to-xo'
import { createXapiGraph } from '@xen-orchestra/xapi-object-to-xo/browser'
import { defineStore } from 'pinia'
import { computed, shallowReactive, toRaw } from 'vue'

type AnyRecord = XenApiRecord<ObjectType>

const useXoObjectGraphStore = defineStore('xo-object-graph', () => {
  const xenApiStore = useXenApiStore()
  const xenApi = xenApiStore.getXapi()

  // Every store the VM translation reads, keyed by the XAPI type it holds
  const storesByType = {
    pool: usePoolStore(),
    host: useHostStore(),
    host_metrics: useHostMetricsStore(),
    vm: useVmRawStore(),
    vm_metrics: useVmMetricsStore(),
    vm_guest_metrics: useVmGuestMetricsStore(),
    vbd: useVbdStore(),
    vdi: useVdiStore(),
    sr: useSrStore(),
    vif: useVifStore(),
    network: useNetworkStore(),
    vtpm: useVtpmStore(),
  }

  const types = Object.keys(storesByType) as (keyof typeof storesByType)[]

  const isReady = computed(() => types.every(type => storesByType[type].getContext().isReady.value))

  const createGraph = () => createXapiGraph({ call: (method, ...args) => xenApi.call(method, args) })

  let graph = createGraph()

  const xoObjectsByRef = shallowReactive(new Map<string, unknown>())
  const dependentRefsByRef = new Map<string, Set<string>>()

  const forget = (opaqueRef: string) => {
    xoObjectsByRef.delete(opaqueRef)

    const dependentRefs = dependentRefsByRef.get(opaqueRef)

    if (dependentRefs === undefined) {
      return
    }

    dependentRefsByRef.delete(opaqueRef)
    dependentRefs.forEach(dependentRef => xoObjectsByRef.delete(dependentRef))
  }

  const translate = (opaqueRef: string) => {
    const xapiObject = graph.getObjectByRef(opaqueRef)

    if (xapiObject === undefined) {
      return undefined
    }

    const dependents: Record<string, string> = {}
    const xoObject = xapiObjectToXo(xapiObject, dependents)

    for (const dependencyRef of Object.keys(dependents)) {
      const dependentRefs = dependentRefsByRef.get(dependencyRef) ?? new Set<string>()
      dependentRefs.add(opaqueRef)
      dependentRefsByRef.set(dependencyRef, dependentRefs)
    }

    return xoObject
  }

  const listeners = types.map(type => {
    const onSet = (record: AnyRecord) => {
      graph.setRecord(type, record.$ref, record)
      forget(record.$ref)
    }

    const onLoad = (records: AnyRecord[]) => records.forEach(onSet)

    const onDelete = (opaqueRef: string) => {
      graph.deleteRecord(opaqueRef)
      forget(opaqueRef)
    }

    return { type, onSet, onLoad, onDelete }
  })

  const onSubscribe = () => {
    for (const { type, onSet, onLoad, onDelete } of listeners) {
      xenApi.addEventListener(`${type}.afterLoad`, onLoad)
      xenApi.addEventListener(`${type}.add`, onSet)
      xenApi.addEventListener(`${type}.mod`, onSet)
      xenApi.addEventListener(`${type}.del`, onDelete)

      // A store loaded by an earlier subscriber will not emit `afterLoad` again
      onLoad(storesByType[type].getContext().records.value)
    }
  }

  const onUnsubscribe = () => {
    for (const { type, onSet, onLoad, onDelete } of listeners) {
      xenApi.removeEventListener(`${type}.afterLoad`, onLoad)
      xenApi.removeEventListener(`${type}.add`, onSet)
      xenApi.removeEventListener(`${type}.mod`, onSet)
      xenApi.removeEventListener(`${type}.del`, onDelete)
    }

    graph = createGraph()
    dependentRefsByRef.clear()
    xoObjectsByRef.clear()
  }

  const getXoObject = <TType extends ObjectType>(opaqueRef: RecordRef<TType>) => {
    if (!isReady.value) {
      return undefined
    }

    if (!xoObjectsByRef.has(opaqueRef)) {
      // Filling the cache is not a change: write past the proxy so readers
      // are not re-triggered. `has` above already tracks this key.
      toRaw(xoObjectsByRef).set(opaqueRef, translate(opaqueRef))
    }

    return xoObjectsByRef.get(opaqueRef) as XoObjectOf<TType> | undefined
  }

  const context = { isReady, getXoObject }

  return createSubscribableStoreContext(
    { context, onSubscribe, onUnsubscribe, isEnabled: () => xenApiStore.isConnected },
    storesByType
  )
})

export function useXoObjectGraph() {
  return useXoObjectGraphStore().subscribe()
}
