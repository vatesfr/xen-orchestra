import type { XenApiRecord } from "@/libs/xen-api";
import type { ComputedRef, Ref } from "vue";

type SimpleExtension<Value extends object> = { type: "simple"; value: Value };

type ConditionalExtension<Value extends object, Condition extends object> = {
  type: "conditional";
  value: Value;
  condition: Condition;
};

type UnpackExtension<E, Options> = E extends SimpleExtension<infer Value>
  ? Value
  : E extends ConditionalExtension<infer Value, infer Condition>
  ? Options extends Condition
    ? Value
    : object
  : object;

export type Extension<
  Value extends object,
  Condition extends object | undefined = undefined
> = Condition extends object
  ? ConditionalExtension<Value, Condition>
  : SimpleExtension<Value>;

export type Options<Extensions extends any[]> = Extensions extends [
  infer First,
  ...infer Rest
]
  ? First extends ConditionalExtension<any, infer Condition>
    ? Rest extends any[]
      ? Partial<Condition> & Options<Rest>
      : Partial<Condition>
    : Rest extends any[]
    ? Options<Rest>
    : object
  : object;

export type Subscription<
  Extensions extends any[],
  Options extends object
> = Extensions extends [infer First, ...infer Rest]
  ? UnpackExtension<First, Options> & Subscription<Rest, Options>
  : object;

export type PartialSubscription<E> = E extends SimpleExtension<infer Value>
  ? Value
  : E extends ConditionalExtension<infer Value, any>
  ? Value
  : never;

export type XenApiRecordExtension<T extends XenApiRecord<any>> = Extension<{
  records: ComputedRef<T[]>;
  getByOpaqueRef: (opaqueRef: T["$ref"]) => T | undefined;
  getByUuid: (uuid: T["uuid"]) => T | undefined;
  hasUuid: (uuid: T["uuid"]) => boolean;
  isReady: Readonly<Ref<boolean>>;
  isFetching: Readonly<Ref<boolean>>;
  isReloading: ComputedRef<boolean>;
  hasError: ComputedRef<boolean>;
  lastError: Readonly<Ref<string | undefined>>;
}>;

export type DeferExtension = Extension<
  {
    start: () => void;
    isStarted: ComputedRef<boolean>;
  },
  { immediate: false }
>;

export type XenApiRecordSubscription<T extends XenApiRecord<any>> =
  PartialSubscription<XenApiRecordExtension<T>>;
