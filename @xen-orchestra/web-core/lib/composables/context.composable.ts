import type { ComputedRef, InjectionKey, MaybeRefOrGetter } from 'vue'
import { computed, inject, provide, toValue } from 'vue'

export const createContext = <T, Output = ComputedRef<T>>(
  initialValue: MaybeRefOrGetter<T>,
  customBuilder?: (value: ComputedRef<T>, previousValue: ComputedRef<T>) => Output
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
  const currentValue = inject(context.id, undefined)

  const updatedValue = () => toValue(newValue) ?? toValue(currentValue) ?? context.initialValue
  provide(context.id, updatedValue)

  return context.builder(
    computed(() => toValue(updatedValue)),
    computed(() => toValue(currentValue))
  )
}
