import type { ComputedRef, InjectionKey, MaybeRefOrGetter } from 'vue'
import { computed, inject, provide, toValue } from 'vue'

export const createContext = <T, Output = ComputedRef<T>>(
  initialValue: MaybeRefOrGetter<T>,
  customBuilder?: (value: ComputedRef<T>) => Output
) => {
  return {
    id: Symbol('CONTEXT_ID') as InjectionKey<MaybeRefOrGetter<T>>,
    initialValue,
    builder: customBuilder ?? (value => value as Output),
  }
}

type Context<T = any, Output = any> = ReturnType<typeof createContext<T, Output>>

type ContextOutput<Ctx extends Context> = Ctx extends Context<any, infer Output> ? Output : never

type ContextValue<Ctx extends Context> = Ctx extends Context<infer T> ? T : never

export const useContext = <Ctx extends Context, T extends ContextValue<Ctx>>(
  context: Ctx,
  newValue?: MaybeRefOrGetter<T | undefined>
): ContextOutput<Ctx> => {
  const currentValue = inject(context.id, context.initialValue)

  const build = (value: MaybeRefOrGetter<T>) => context.builder(computed(() => toValue(value)))

  if (newValue !== undefined) {
    const updatedValue = () => toValue(newValue) ?? toValue(currentValue)
    provide(context.id, updatedValue)
    return build(updatedValue)
  }

  return build(currentValue)
}
