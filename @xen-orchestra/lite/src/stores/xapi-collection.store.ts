import type {
  RawObjectType,
  XenApiConsole,
  XenApiHost,
  XenApiHostMetrics,
  XenApiPool,
  XenApiRecord,
  XenApiSr,
  XenApiTask,
  XenApiVm,
  XenApiVmGuestMetrics,
  XenApiVmMetrics,
} from "@/libs/xen-api";
import { useXenApiStore } from "@/stores/xen-api.store";
import { tryOnUnmounted, whenever } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, type ComputedRef, type Ref, ref } from "vue";

export const useXapiCollectionStore = defineStore("xapiCollection", () => {
  const collections = ref(
    new Map<RawObjectType, ReturnType<typeof createXapiCollection<any>>>()
  );

  function get<
    T extends RawObjectType,
    S extends XenApiRecord = RawTypeToObject[T]
  >(type: T): ReturnType<typeof createXapiCollection<S>> {
    if (!collections.value.has(type)) {
      collections.value.set(type, createXapiCollection<S>(type));
    }

    return collections.value.get(type)!;
  }

  return { get };
});

export interface CollectionSubscription<T extends XenApiRecord> {
  records: ComputedRef<T[]>;
  getByOpaqueRef: (opaqueRef: string) => T | undefined;
  getByUuid: (uuid: string) => T | undefined;
  hasUuid: (uuid: string) => boolean;
  isReady: Ref<boolean>;
}

const createXapiCollection = <T extends XenApiRecord>(type: RawObjectType) => {
  const isReady = ref(false);
  const subscriptions = ref(new Set<symbol>());
  const recordsByOpaqueRef = ref(new Map<string, T>());
  const recordsByUuid = ref(new Map<string, T>());
  const filter = ref<(record: T) => boolean>();
  const sort = ref<(record1: T, record2: T) => 1 | 0 | -1>();
  const xenApiStore = useXenApiStore();

  const setFilter = (newFilter: (record: T) => boolean) =>
    (filter.value = newFilter);

  const setSort = (newSort: (record1: T, record2: T) => 1 | 0 | -1) =>
    (sort.value = newSort);

  const records = computed<T[]>(() => {
    const records = Array.from(recordsByOpaqueRef.value.values()).sort(
      sort.value
    );
    return filter.value !== undefined ? records.filter(filter.value) : records;
  });

  const getByOpaqueRef = (opaqueRef: string) =>
    recordsByOpaqueRef.value.get(opaqueRef);

  const getByUuid = (uuid: string) => recordsByUuid.value.get(uuid);

  const hasUuid = (uuid: string) => recordsByUuid.value.has(uuid);

  const hasSubscriptions = computed(() => subscriptions.value.size > 0);

  const fetchAll = async () => {
    const records = await xenApiStore.getXapi().loadRecords<T>(type);
    recordsByOpaqueRef.value.clear();
    recordsByUuid.value.clear();
    records.forEach(add);
    isReady.value = true;
  };

  const add = (record: T) => {
    recordsByOpaqueRef.value.set(record.$ref, record);
    recordsByUuid.value.set(record.uuid, record);
  };

  const update = (record: T) => {
    recordsByOpaqueRef.value.set(record.$ref, record);
    recordsByUuid.value.set(record.uuid, record);
  };

  const remove = (opaqueRef: string) => {
    if (!recordsByOpaqueRef.value.has(opaqueRef)) {
      return;
    }

    const record = recordsByOpaqueRef.value.get(opaqueRef)!;
    recordsByOpaqueRef.value.delete(opaqueRef);
    recordsByUuid.value.delete(record.uuid);
  };

  whenever(
    () => xenApiStore.isConnected && hasSubscriptions.value,
    () => fetchAll()
  );

  const subscribe = (): CollectionSubscription<T> => {
    const id = Symbol();

    subscriptions.value.add(id);

    tryOnUnmounted(() => {
      unsubscribe(id);
    });

    return {
      records,
      getByOpaqueRef,
      getByUuid,
      hasUuid,
      isReady,
    };
  };

  const unsubscribe = (id: symbol) => subscriptions.value.delete(id);

  return {
    hasSubscriptions,
    subscribe,
    unsubscribe,
    add,
    update,
    remove,
    setFilter,
    setSort,
  };
};

type RawTypeToObject = {
  Bond: never;
  Certificate: never;
  Cluster: never;
  Cluster_host: never;
  DR_task: never;
  Feature: never;
  GPU_group: never;
  PBD: never;
  PCI: never;
  PGPU: never;
  PIF: never;
  PIF_metrics: never;
  PUSB: never;
  PVS_cache_storage: never;
  PVS_proxy: never;
  PVS_server: never;
  PVS_site: never;
  SDN_controller: never;
  SM: never;
  SR: XenApiSr;
  USB_group: never;
  VBD: never;
  VBD_metrics: never;
  VDI: never;
  VGPU: never;
  VGPU_type: never;
  VIF: never;
  VIF_metrics: never;
  VLAN: never;
  VM: XenApiVm;
  VMPP: never;
  VMSS: never;
  VM_guest_metrics: XenApiVmGuestMetrics;
  VM_metrics: XenApiVmMetrics;
  VUSB: never;
  blob: never;
  console: XenApiConsole;
  crashdump: never;
  host: XenApiHost;
  host_cpu: never;
  host_crashdump: never;
  host_metrics: XenApiHostMetrics;
  host_patch: never;
  network: never;
  network_sriov: never;
  pool: XenApiPool;
  pool_patch: never;
  pool_update: never;
  role: never;
  secret: never;
  subject: never;
  task: XenApiTask;
  tunnel: never;
};
