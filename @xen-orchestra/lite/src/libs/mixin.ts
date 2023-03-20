type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
  x: infer R
) => any
  ? R
  : never;

export type MixinConstructor<T = unknown> = new (...args: any[]) => T;

export type MixinAbstractConstructor<T = unknown> = abstract new (
  ...args: any[]
) => T;

export type MixinFunction<
  T extends MixinConstructor | MixinAbstractConstructor = MixinConstructor,
  R extends T = T & MixinConstructor
> = (Base: T) => R;

export type MixinReturnValue<
  T extends MixinConstructor | MixinAbstractConstructor,
  M extends MixinFunction<T, any>[]
> = UnionToIntersection<
  | T
  | {
      [K in keyof M]: M[K] extends MixinFunction<any, infer U> ? U : never;
    }[number]
>;

export default function mixin<
  T extends MixinConstructor | MixinAbstractConstructor,
  M extends MixinFunction<T, any>[]
>(Base: T, ...mixins: M): MixinReturnValue<T, M> {
  return mixins.reduce(
    (mix, applyMixin) => applyMixin(mix),
    Base
  ) as MixinReturnValue<T, M>;
}
