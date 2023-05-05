import type {
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
import type { ComputedRef, Ref } from "vue";

export interface SubscribeOptions<Immediate extends boolean> {
  immediate?: Immediate;
}

export interface CollectionSubscription<T extends XenApiRecord> {
  records: ComputedRef<T[]>;
  getByOpaqueRef: (opaqueRef: string) => T | undefined;
  getByUuid: (uuid: string) => T | undefined;
  hasUuid: (uuid: string) => boolean;
  isReady: Readonly<Ref<boolean>>;
  isFetching: Readonly<Ref<boolean>>;
  isReloading: ComputedRef<boolean>;
  hasError: ComputedRef<boolean>;
  lastError: Readonly<Ref<string | undefined>>;
}

export interface DeferredCollectionSubscription<T extends XenApiRecord>
  extends CollectionSubscription<T> {
  start: () => void;
  isStarted: ComputedRef<boolean>;
}

export type RawTypeToObject = {
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
