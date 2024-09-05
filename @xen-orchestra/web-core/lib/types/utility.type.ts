export type MaybeArray<T> = T | T[]

export type VoidFunction = () => void

declare const __brand: unique symbol

export type Branded<TBrand extends string, TType = string> = TType & { [__brand]: TBrand }

export type EmptyObject = Record<string, never>
