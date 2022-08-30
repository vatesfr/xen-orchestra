import { utcParse } from "d3-time-format";
import { round } from "lodash-es";
import { find, forEach, size, sum } from "lodash-es";
import type { Filter } from "@/types/filter";
import { faSquareCheck } from "@fortawesome/free-regular-svg-icons";
import { faFont, faHashtag, faList } from "@fortawesome/free-solid-svg-icons";

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
export function getAvgCpuUsage(cpus?: object | any[]) {
  const length = getStatsLength(cpus);
  if (length === undefined) {
    return;
  }
  let totalCpusUsage = 0;
  forEach(cpus, (cpuState: number[]) => {
    totalCpusUsage += sum(cpuState);
  });
  const stackedValue = totalCpusUsage / length;
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
