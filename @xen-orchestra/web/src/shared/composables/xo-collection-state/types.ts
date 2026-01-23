import type { XoRecord } from '@vates/types'
import type { MaybeRefOrGetter } from '@vueuse/shared'
import type { ComputedRef, Ref } from 'vue'

export type NameConfig = {
  records: string
  getById: string
  getByIds: string
  useGetById: string
  useGetByIds: string
  hasById: string
  useHasById: string
  isReady: string
  isFetching: string
  hasError: string
  lastError: string
}

export type BaseName = string | [string, string] | NameConfig

export type DefaultState<TRecord extends Partial<XoRecord>> = {
  records: Ref<TRecord[]>
  getById: (id: TRecord['id'] | undefined) => TRecord | undefined
  getByIds: (ids: TRecord['id'][]) => TRecord[]
  useGetById: (id: MaybeRefOrGetter<TRecord['id'] | undefined>) => ComputedRef<TRecord | undefined>
  useGetByIds: (id: MaybeRefOrGetter<TRecord['id'][]>) => ComputedRef<TRecord[]>
  hasById: (id: TRecord['id'] | undefined) => boolean
  useHasById: (id: MaybeRefOrGetter<TRecord['id'] | undefined>) => ComputedRef<boolean>
  isReady: ComputedRef<boolean>
  isFetching: ComputedRef<boolean>
  hasError: ComputedRef<boolean>
  lastError: ComputedRef<Error | undefined>
}

export type CollectionState<TRecord extends Partial<XoRecord>, TNameConfig extends NameConfig> = {
  [K in keyof NameConfig as TNameConfig[K]]: DefaultState<TRecord>[K]
}
