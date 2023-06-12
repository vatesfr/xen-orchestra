import type {
  XenApiConsole,
  XenApiHost,
  XenApiHostMetrics,
  XenApiMessage,
  XenApiPool,
  XenApiRecord,
  XenApiSr,
  XenApiTask,
  XenApiVm,
  XenApiVmGuestMetrics,
  XenApiVmMetrics,
} from "@/libs/xen-api";
import type { ComputedRef, Ref } from "vue";

type DefaultExtension<T extends XenApiRecord> = {
  records: ComputedRef<T[]>;
  getByOpaqueRef: (opaqueRef: string) => T | undefined;
  getByUuid: (uuid: string) => T | undefined;
  hasUuid: (uuid: string) => boolean;
  isReady: Readonly<Ref<boolean>>;
  isFetching: Readonly<Ref<boolean>>;
  isReloading: ComputedRef<boolean>;
  hasError: ComputedRef<boolean>;
  lastError: Readonly<Ref<string | undefined>>;
};

type DeferExtension = [
  {
    start: () => void;
    isStarted: ComputedRef<boolean>;
  },
  { immediate: false }
];

type DefaultExtensions<T extends XenApiRecord> = [
  DefaultExtension<T>,
  DeferExtension
];

type GenerateSubscribeOptions<Extensions extends any[]> = Extensions extends [
  infer FirstExtension,
  ...infer RestExtension
]
  ? FirstExtension extends [object, infer FirstCondition]
    ? FirstCondition & GenerateSubscribeOptions<RestExtension>
    : GenerateSubscribeOptions<RestExtension>
  : object;

export type SubscribeOptions<Extensions extends any[]> = Partial<
  GenerateSubscribeOptions<Extensions> &
    GenerateSubscribeOptions<DefaultExtensions<any>>
>;

type GenerateSubscription<
  Options extends object,
  Extensions extends any[]
> = Extensions extends [infer FirstExtension, ...infer RestExtension]
  ? FirstExtension extends [infer FirstObject, infer FirstCondition]
    ? Options extends FirstCondition
      ? FirstObject & GenerateSubscription<Options, RestExtension>
      : GenerateSubscription<Options, RestExtension>
    : FirstExtension & GenerateSubscription<Options, RestExtension>
  : object;

export type Subscription<
  T extends XenApiRecord,
  Options extends object,
  Extensions extends any[] = []
> = GenerateSubscription<Options, Extensions> &
  GenerateSubscription<Options, DefaultExtensions<T>>;

export function createSubscribe<
  T extends XenApiRecord,
  Extensions extends any[],
  Options extends object = SubscribeOptions<Extensions>
>(builder: (options?: Options) => Subscription<T, Options, Extensions>) {
  return function subscribe<O extends Options>(
    options?: O
  ): Subscription<T, O, Extensions> {
    return builder(options);
  };
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
  message: XenApiMessage;
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
