import type { ComputedRef, MaybeRefOrGetter, Reactive } from 'vue'

export type Progress = {
  current: ComputedRef<number>
  total: ComputedRef<number>
  percentage: ComputedRef<number>
  fillWidth: ComputedRef<string>
  percentageCap: ComputedRef<number>
}

export type ProgressGroup<TSource> = {
  progressItems: ComputedRef<Reactive<Progress & { source: TSource }>[]>
  highestPercentage: ComputedRef<number>
  highestPercentageCap: ComputedRef<number>
}

export type UseProgressGroupOptions = {
  sort?: MaybeRefOrGetter<'asc' | 'desc' | undefined>
}
