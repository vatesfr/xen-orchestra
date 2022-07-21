import type { IconDefinition } from "@fortawesome/fontawesome-common-types";

export type FilterType = "string" | "boolean" | "number" | "enum";

export interface FilterComparison {
  label: string;
  pattern: string;
  default?: boolean;
  before?: string | IconDefinition;
  after?: string | IconDefinition;
  escape?: boolean;
}

export type FilterComparisons = Record<FilterType, FilterComparison[]>;

interface AvailableFilterCommon {
  property: string;
  label?: string;
  icon?: IconDefinition;
}

export interface AvailableFilterEnum extends AvailableFilterCommon {
  type: "enum";
  choices: string[];
}

interface AvailableFilterOther extends AvailableFilterCommon {
  type: Exclude<FilterType, "enum">;
}

export type AvailableFilter = AvailableFilterEnum | AvailableFilterOther;
