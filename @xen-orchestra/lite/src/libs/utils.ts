import { utcParse } from "d3-time-format";
import type { Filter } from "@/types/filter";
import { faSquareCheck } from "@fortawesome/pro-regular-svg-icons";
import { faFont, faHashtag, faList } from "@fortawesome/pro-solid-svg-icons";

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
