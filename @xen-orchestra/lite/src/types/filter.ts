import type { IconDefinition } from "@fortawesome/fontawesome-common-types";

export type FilterType = "string" | "boolean" | "number" | "enum";

export type FilterComparisonType =
  | "stringContains"
  | "stringDoesNotContains"
  | "stringEquals"
  | "stringDoesNotEqual"
  | "stringStartsWith"
  | "stringDoesNotStartWith"
  | "stringEndsWith"
  | "stringDoesNotEndWith"
  | "stringMatchesRegex"
  | "stringDoesNotMatchRegex"
  | "numberLessThan"
  | "numberLessThanOrEquals"
  | "numberEquals"
  | "numberGreaterThanOrEquals"
  | "numberGreaterThan"
  | "booleanTrue"
  | "booleanFalse"
  | "enumIs"
  | "enumIsNot";

export type FilterComparisons = {
  [key in FilterComparisonType]?: string;
};

interface FilterCommon {
  label?: string;
  icon?: IconDefinition;
}

export interface FilterEnum extends FilterCommon {
  type: "enum";
  choices: string[];
}

interface FilterOther extends FilterCommon {
  type: Exclude<FilterType, "enum">;
}

export type Filter = FilterEnum | FilterOther;

export type Filters = { [key: string]: Filter };

export interface NewFilter {
  id: number;
  content: string;
  isAdvanced: boolean;
  builder: {
    property: string;
    comparison: FilterComparisonType | "";
    value: string;
    negate: boolean;
  };
}
