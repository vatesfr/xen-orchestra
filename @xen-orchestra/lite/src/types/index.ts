export type Color = "info" | "error" | "warning" | "success";

export type SlotDefinition<
  T extends Record<string, unknown> = Record<string, never>,
  R = any
> = (props: T) => R;
