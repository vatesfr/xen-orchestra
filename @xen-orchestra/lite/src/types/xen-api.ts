import type {
  RawObjectType,
  XenApiHost,
  XenApiMessage,
  XenApiNetwork,
  XenApiSr,
  XenApiVdi,
  XenApiVm,
} from "@/libs/xen-api/xen-api.types";

export type XenApiAlarmType =
  | "cpu_usage"
  | "network_usage"
  | "disk_usage"
  | "fs_usage"
  | "log_fs_usage"
  | "mem_usage"
  | "physical_utilisation"
  | "sr_io_throughput_total_per_host"
  | "memory_free_kib"
  | "unknown";

export interface XenApiAlarm<RelationType extends RawObjectType>
  extends XenApiMessage<RelationType> {
  level: number;
  triggerLevel: number;
  type: XenApiAlarmType;
}

export type XenApiPatch = {
  $id: string;
  name: string;
  description: string;
  license: string;
  release: string;
  size: number;
  url: string;
  version: string;
  changelog: {
    date: number;
    description: string;
    author: string;
  };
};

export type XenApiMigrationToken = Record<string, string>;

export type XenApiMigrationParams = [
  XenApiVm["$ref"],
  XenApiMigrationToken,
  boolean,
  Record<XenApiVdi["$ref"], XenApiSr["$ref"]>,
  Record<any, never>,
  { force: "true" | "false" },
];

export type VmRefsWithPowerState = Record<
  XenApiVm["$ref"],
  XenApiVm["power_state"]
>;

export type VmRefsWithNameLabel = Record<XenApiVm["$ref"], string>;

export type VmMigrationData = {
  destinationHost: XenApiHost["$ref"];
  migrationNetwork: XenApiNetwork["$ref"];
  destinationSr: XenApiSr["$ref"];
  vdisMap: Record<XenApiVdi["$ref"], XenApiSr["$ref"]>;
  force?: boolean;
  bypassAssert?: boolean;
};

export type VmRefsWithMigration = Record<XenApiVm["$ref"], VmMigrationData>;
