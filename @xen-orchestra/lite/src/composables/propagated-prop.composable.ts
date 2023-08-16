import {
  computed,
  type ComputedRef,
  inject,
  type InjectionKey,
  type MaybeRefOrGetter,
  provide,
  toValue,
} from "vue";

export const usePropagatedProp = <
  K extends InjectionKey<ComputedRef<any>>,
  C extends ComputedRef<any> = K extends InjectionKey<infer C> ? C : never,
  T = C extends ComputedRef<infer T> ? T : never,
>(
  injectionKey: K,
  newValue?: MaybeRefOrGetter<T>
) => {
  const parentValue = inject(injectionKey, undefined) as C;

  const currentValue = computed(
    () => toValue(newValue) ?? toValue(parentValue)
  ) as C;

  provide<C, InjectionKey<C>>(injectionKey, currentValue);

  return currentValue;
};
