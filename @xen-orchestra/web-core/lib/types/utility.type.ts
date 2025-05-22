export type MaybeArray<T> = T | T[]

export type VoidFunction = () => void

declare const __brand: unique symbol

export type Branded<TBrand extends string, TType = string> = TType & { [__brand]: TBrand }

export type EmptyObject = Record<string, never>

export type StringKeyOf<T> = Extract<keyof T, string>

export type KeyOfByValue<T, TValue> =
  T extends Record<PropertyKey, unknown>
    ? keyof {
        [K in keyof T as T[K] extends TValue ? K : never]: T[K]
      }
    : never

export type ArrayFilterPredicate<T> = (value: T, index: number, array: T[]) => boolean
