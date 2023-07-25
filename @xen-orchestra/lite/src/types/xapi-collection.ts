import type {
  RawObjectType,
  XenApiConsole,
  XenApiHost,
  XenApiHostMetrics,
  XenApiMessage,
  XenApiPool,
  XenApiSr,
  XenApiTask,
  XenApiVm,
  XenApiVmGuestMetrics,
  XenApiVmMetrics,
} from "@/libs/xen-api";
import type { ComputedRef, Ref } from "vue";

type DefaultExtension<
  T extends RawObjectType,
  R extends RawTypeToRecord<T> = RawTypeToRecord<T>
> = {
  records: ComputedRef<R[]>;
  getByOpaqueRef: (opaqueRef: R["$ref"]) => R | undefined;
  getByUuid: (uuid: R["uuid"]) => R | undefined;
  hasUuid: (uuid: R["uuid"]) => boolean;
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

type DefaultExtensions<T extends RawObjectType> = [
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
  T extends RawObjectType,
  Options extends object,
  Extensions extends any[] = []
> = GenerateSubscription<Options, Extensions> &
  GenerateSubscription<Options, DefaultExtensions<T>>;

export function createSubscribe<
  T extends RawObjectType,
  Extensions extends any[],
  Options extends object = SubscribeOptions<Extensions>
>(builder: (options?: Options) => Subscription<T, Options, Extensions>) {
  return function subscribe<O extends Options>(
    options?: O
  ): Subscription<T, O, Extensions> {
    return builder(options);
  };
}

export type RawTypeToRecord<T extends RawObjectType> = T extends "SR"
  ? XenApiSr
  : T extends "VM"
  ? XenApiVm
  : T extends "VM_guest_metrics"
  ? XenApiVmGuestMetrics
  : T extends "VM_metrics"
  ? XenApiVmMetrics
  : T extends "console"
  ? XenApiConsole
  : T extends "host"
  ? XenApiHost
  : T extends "host_metrics"
  ? XenApiHostMetrics
  : T extends "message"
  ? XenApiMessage
  : T extends "pool"
  ? XenApiPool
  : T extends "task"
  ? XenApiTask
  : never;
