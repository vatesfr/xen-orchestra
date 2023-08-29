import type {
  XEN_API_OBJECT_TYPES,
  POWER_STATE,
  VM_OPERATION,
} from "@/libs/xen-api/xen-api.utils";

type TypeMapping = typeof XEN_API_OBJECT_TYPES;
export type ObjectType = keyof TypeMapping;
export type RawObjectType = TypeMapping[ObjectType];

export type RawTypeToType<RawType extends RawObjectType> = Lowercase<RawType>;
export type TypeToRawType<Type extends ObjectType> = TypeMapping[Type];

type ObjectTypeToRecordMapping = {
  console: XenApiConsole;
  host: XenApiHost;
  host_metrics: XenApiHostMetrics;
  message: XenApiMessage<any>;
  pool: XenApiPool;
  sr: XenApiSr;
  vm: XenApiVm;
  vm_guest_metrics: XenApiVmGuestMetrics;
  vm_metrics: XenApiVmMetrics;
};

export type ObjectTypeToRecord<Type extends ObjectType> =
  Type extends keyof ObjectTypeToRecordMapping
    ? ObjectTypeToRecordMapping[Type]
    : never;

export type XenApiRecordBeforeLoadEvent<Type extends ObjectType> =
  `${Type}.beforeLoad`;
export type XenApiRecordAfterLoadEvent<Type extends ObjectType> =
  `${Type}.afterLoad`;
export type XenApiRecordAddEvent<Type extends ObjectType> = `${Type}.add`;
export type XenApiRecordModEvent<Type extends ObjectType> = `${Type}.mod`;
export type XenApiRecordDelEvent<Type extends ObjectType> = `${Type}.del`;
export type XenApiRecordEvent<Type extends ObjectType> =
  | XenApiRecordBeforeLoadEvent<Type>
  | XenApiRecordAfterLoadEvent<Type>
  | XenApiRecordAddEvent<Type>
  | XenApiRecordModEvent<Type>
  | XenApiRecordDelEvent<Type>;

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

export interface XenApiMessage<RelationType extends RawObjectType>
  extends XenApiRecord<"message"> {
  body: string;
  cls: RelationType;
  name: string;
  obj_uuid: ObjectTypeToRecord<RawTypeToType<RelationType>>["uuid"];
  priority: number;
  timestamp: string;
}

export type XenApiEvent<
  RelationType extends ObjectType,
  XRecord extends ObjectTypeToRecord<RelationType>,
> = {
  id: string;
  class: RelationType;
  operation: "add" | "mod" | "del";
  ref: XRecord["$ref"];
  snapshot: RawXenApiRecord<XRecord>;
};
