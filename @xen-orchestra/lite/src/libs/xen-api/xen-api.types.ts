import type {
  XEN_API_OBJECT_TYPES,
  POWER_STATE,
  VM_OPERATION,
} from "@/libs/xen-api/xen-api.utils";

export type ObjectType = keyof typeof XEN_API_OBJECT_TYPES;

export type RawObjectType<Type extends ObjectType> =
  (typeof XEN_API_OBJECT_TYPES)[Type];

export type ObjectTypeToRecord<Type extends ObjectType> = Type extends "sr"
  ? XenApiSr
  : Type extends "vm"
  ? XenApiVm
  : Type extends "vm_guest_metrics"
  ? XenApiVmGuestMetrics
  : Type extends "vm_metrics"
  ? XenApiVmMetrics
  : Type extends "console"
  ? XenApiConsole
  : Type extends "host"
  ? XenApiHost
  : Type extends "host_metrics"
  ? XenApiHostMetrics
  : Type extends "message"
  ? XenApiMessage<any>
  : Type extends "pool"
  ? XenApiPool
  : Type extends "task"
  ? XenApiTask
  : never;

export type XenApiRecordAddEvent<Type extends ObjectType> = `${Type}.add`;
export type XenApiRecordModEvent<Type extends ObjectType> = `${Type}.mod`;
export type XenApiRecordDelEvent<Type extends ObjectType> = `${Type}.del`;
export type XenApiRecordEvent =
  | XenApiRecordAddEvent<any>
  | XenApiRecordModEvent<any>
  | XenApiRecordDelEvent<any>;

declare const __brand: unique symbol;

export interface XenApiRecord<Type extends ObjectType> {
  $ref: string & { [__brand]: `${Type}Ref` };
  uuid: string & { [__brand]: `${Type}Uuid` };
}

export type RawXenApiRecord<T extends XenApiRecord<ObjectType>> = Omit<
  T,
  "$ref"
>;

export interface XenApiPool extends XenApiRecord<"pool"> {
  cpu_info: {
    cpu_count: string;
  };
  master: XenApiHost["$ref"];
  name_label: string;
}

export interface XenApiHost extends XenApiRecord<"host"> {
  address: string;
  name_label: string;
  metrics: XenApiHostMetrics["$ref"];
  resident_VMs: XenApiVm["$ref"][];
  cpu_info: { cpu_count: string };
  software_version: { product_version: string };
}

export interface XenApiSr extends XenApiRecord<"sr"> {
  name_label: string;
  physical_size: number;
  physical_utilisation: number;
}

export interface XenApiVm extends XenApiRecord<"vm"> {
  current_operations: Record<string, VM_OPERATION>;
  guest_metrics: string;
  metrics: XenApiVmMetrics["$ref"];
  name_label: string;
  name_description: string;
  power_state: POWER_STATE;
  resident_on: XenApiHost["$ref"];
  consoles: XenApiConsole["$ref"][];
  is_control_domain: boolean;
  is_a_snapshot: boolean;
  is_a_template: boolean;
  VCPUs_at_startup: number;
}

export interface XenApiConsole extends XenApiRecord<"console"> {
  protocol: string;
  location: string;
}

export interface XenApiHostMetrics extends XenApiRecord<"host_metrics"> {
  live: boolean;
  memory_free: number;
  memory_total: number;
}

export interface XenApiVmMetrics extends XenApiRecord<"vm_metrics"> {
  VCPUs_number: number;
}

export type XenApiVmGuestMetrics = XenApiRecord<"vm_guest_metrics">;

export interface XenApiTask extends XenApiRecord<"task"> {
  name_label: string;
  resident_on: XenApiHost["$ref"];
  created: string;
  finished: string;
  status: string;
  progress: number;
}

export interface XenApiMessage<Type extends ObjectType = ObjectType>
  extends XenApiRecord<"message"> {
  body: string;
  cls: RawObjectType<Type>;
  name: string;
  obj_uuid: ObjectTypeToRecord<Type>["uuid"];
  priority: number;
  timestamp: string;
}

export type XenApiEvent = {
  id: string;
  class: ObjectType;
  operation: "add" | "mod" | "del";
  ref: string;
  snapshot: any;
};
