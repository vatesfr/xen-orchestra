import type { IconDefinition } from "@fortawesome/fontawesome-common-types";

interface Sort {
  label?: string;
  icon?: IconDefinition;
}

export type Sorts = { [key: string]: Sort };

export type ActiveSorts = Map<string, boolean>;
