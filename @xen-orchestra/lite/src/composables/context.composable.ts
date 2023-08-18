import {
  computed,
  type ComputedRef,
  inject,
  type InjectionKey,
  type MaybeRefOrGetter,
  provide,
  toValue,
} from "vue";

type Context<T> = {
  key: InjectionKey<ComputedRef<T>>;
  defaultValue: T;
};

export const createContext = <T>(defaultValue: T): Context<T> => {
  return {
    key: Symbol() as InjectionKey<ComputedRef<T>>,
    defaultValue,
  };
};

export const useContext = <T>(
  context: Context<T>,
  newValue?: MaybeRefOrGetter<T | undefined>
) => {
  const parentValue = inject<T>(context.key, context.defaultValue);

  const currentValue = computed(
    () => toValue(newValue) ?? toValue(parentValue)
  );

  provide(context.key, currentValue);

  return currentValue;
};
