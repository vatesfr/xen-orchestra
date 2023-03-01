import type { IconDefinition } from "@fortawesome/fontawesome-common-types";

interface Sort {
  label?: string;
  icon?: IconDefinition;
}

export interface Sorts {
  [key: string]: Sort;
}

export type ActiveSorts<T> = Map<keyof T, boolean>;

export type InitialSorts<T> = `${"-" | ""}${Extract<keyof T, string>}`[];

export interface SortConfig<T> {
  queryStringParam?: string;
  initialSorts?: InitialSorts<T>;
}
