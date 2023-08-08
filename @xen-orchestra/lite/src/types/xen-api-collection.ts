import type {
  RawObjectType,
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
import type { XenApiCollection } from "@/libs/xen-api-collection";
import type { ComputedRef } from "vue";

export type RawTypeToRecord<ObjectType extends RawObjectType> =
  ObjectType extends "SR"
    ? XenApiSr
    : ObjectType extends "VM"
    ? XenApiVm
    : ObjectType extends "VM_guest_metrics"
    ? XenApiVmGuestMetrics
    : ObjectType extends "VM_metrics"
    ? XenApiVmMetrics
    : ObjectType extends "console"
    ? XenApiConsole
    : ObjectType extends "host"
    ? XenApiHost
    : ObjectType extends "host_metrics"
    ? XenApiHostMetrics
    : ObjectType extends "message"
    ? XenApiMessage
    : ObjectType extends "pool"
    ? XenApiPool
    : ObjectType extends "task"
    ? XenApiTask
    : never;

type XenApiBaseCollectionProps =
  | "isFetching"
  | "isReloading"
  | "hasError"
  | "hasUuid"
  | "isReady"
  | "getByUuid"
  | "getByOpaqueRef"
  | "records";

type XenApiCollectionManagerProps =
  | "add"
  | "remove"
  | "update"
  | "hasSubscriptions";

export type XenApiBaseCollection<
  Record extends XenApiRecord<any>,
  Immediate extends boolean,
> = Pick<XenApiCollection<Record>, XenApiBaseCollectionProps> &
  (Immediate extends false
    ? { start: () => void; isStarted: ComputedRef<boolean> }
    : object);

export type XenApiCollectionManager<Record extends XenApiRecord<any>> = Pick<
  XenApiCollection<Record>,
  XenApiCollectionManagerProps
>;
