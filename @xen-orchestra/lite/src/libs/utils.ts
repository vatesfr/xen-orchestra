import type { RawObjectType } from "@/libs/xen-api";
import type {
  RawXenApiRecord,
  XenApiHost,
  XenApiHostMetrics,
  XenApiRecord,
} from "@/libs/xen-api";
import type { CollectionSubscription } from "@/stores/xapi-collection.store";
import type { Filter } from "@/types/filter";
import { faSquareCheck } from "@fortawesome/free-regular-svg-icons";
import { faFont, faHashtag, faList } from "@fortawesome/free-solid-svg-icons";
import { utcParse } from "d3-time-format";
import humanFormat from "human-format";
import { find, forEach, round, size, sum } from "lodash-es";

export function sortRecordsByNameLabel(
  record1: { name_label: string },
  record2: { name_label: string }
) {
  const label1 = record1.name_label.toLocaleLowerCase();
  const label2 = record2.name_label.toLocaleLowerCase();

  switch (true) {
    case label1 < label2:
      return -1;
    case label1 > label2:
      return 1;
    default:
      return 0;
  }
}

export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const iconsByType = {
  string: faFont,
  number: faHashtag,
  boolean: faSquareCheck,
  enum: faList,
};

export function formatSize(bytes: number) {
  return bytes != null
    ? humanFormat(bytes, { scale: "binary", unit: "B" })
    : "N/D";
}

export function getFilterIcon(filter: Filter | undefined) {
  if (!filter) {
    return;
  }

  if (filter.icon) {
    return filter.icon;
  }

  return iconsByType[filter.type];
}

export function parseDateTime(dateTime: string) {
  dateTime = dateTime.replace(/(-|\.\d{3})/g, ""); // Allow toISOString() date-time format
  const date = utcParse("%Y%m%dT%H:%M:%SZ")(dateTime);
  if (date === null) {
    throw new RangeError(
      `unable to parse XAPI datetime ${JSON.stringify(dateTime)}`
    );
  }
  return date.getTime();
}

export const hasEllipsis = (target: Element | undefined | null) =>
  target != undefined && target.clientWidth < target.scrollWidth;

export function percent(currentValue: number, maxValue: number, precision = 2) {
  return round((currentValue / maxValue) * 100, precision);
}

export function getAvgCpuUsage(cpus?: object | any[], { nSequence = 4 } = {}) {
  const statsLength = getStatsLength(cpus);
  if (statsLength === undefined) {
    return;
  }
  const _nSequence = statsLength < nSequence ? statsLength : nSequence;

  let totalCpusUsage = 0;
  forEach(cpus, (cpuState: number[]) => {
    totalCpusUsage += sum(cpuState.slice(cpuState.length - _nSequence));
  });
  const stackedValue = totalCpusUsage / _nSequence;
  return stackedValue / size(cpus);
}

// stats can be null.
// Return the size of the first non-null object.
export function getStatsLength(stats?: object | any[]) {
  if (stats === undefined) {
    return undefined;
  }
  return size(find(stats, (stat) => stat != null));
}

export function isHostRunning(
  host: XenApiHost,
  hostMetricsSubscription: CollectionSubscription<XenApiHostMetrics>
) {
  return hostMetricsSubscription.getByOpaqueRef(host.metrics)?.live === true;
}

export function getHostMemory(
  host: XenApiHost,
  hostMetricsSubscription: CollectionSubscription<XenApiHostMetrics>
) {
  const hostMetrics = hostMetricsSubscription.getByOpaqueRef(host.metrics);

  if (hostMetrics !== undefined) {
    const total = +hostMetrics.memory_total;
    return {
      usage: total - +hostMetrics.memory_free,
      size: total,
    };
  }
}

export const buildXoObject = <T extends XenApiRecord>(
  record: RawXenApiRecord<T>,
  params: { opaqueRef: string }
) => {
  return {
    ...record,
    $ref: params.opaqueRef,
  } as T;
};

export function parseRamUsage(
  {
    memory,
    memoryFree,
  }: {
    memory: number[];
    memoryFree?: number[];
  },
  { nSequence = 4 } = {}
) {
  const _nSequence = Math.min(memory.length, nSequence);

  let total = 0;
  let used = 0;

  memory = memory.slice(memory.length - _nSequence);
  memoryFree = memoryFree?.slice(memoryFree.length - _nSequence);

  memory.forEach((ram, key) => {
    total += ram;
    used += ram - (memoryFree?.[key] ?? 0);
  });

  const percentUsed = percent(used, total);
  return {
    // In case `memoryFree` is not given by the xapi,
    // we won't be able to calculate the percentage of used memory properly.
    percentUsed:
      memoryFree === undefined || isNaN(percentUsed) ? 0 : percentUsed,
    total: total / _nSequence,
    used: memoryFree === undefined ? 0 : used / _nSequence,
  };
}

export const getFirst = <T>(value: T | T[]): T | undefined =>
  Array.isArray(value) ? value[0] : value;

export function requireSubscription<T>(
  subscription: T | undefined,
  type: RawObjectType
): asserts subscription is T {
  if (subscription === undefined) {
    throw new Error(`You need to provide a ${type} subscription`);
  }
}
