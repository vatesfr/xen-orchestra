import { mountComposable } from '@/test/mount-composable.ts'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'

interface EnhancedDataResult {
  getDisplayData: (item: never) => unknown
}

type Filterable<TResult extends EnhancedDataResult> = Parameters<TResult['getDisplayData']>[0]

type Display<TResult extends EnhancedDataResult> = ReturnType<TResult['getDisplayData']>

export function createEnhancedDataHelpers<TSource, TResult extends EnhancedDataResult>(
  useEnhancedData: (sources: MaybeRefOrGetter<TSource[]>) => TResult,
  getFilterables: (result: TResult) => ComputedRef<Filterable<TResult>[]>,
  createSource: () => TSource
) {
  function mountEnhancedData(sources: MaybeRefOrGetter<TSource[]> = [createSource()]) {
    return mountComposable(() => useEnhancedData(sources)).result
  }

  function mountFirstFilterable(sources: TSource[] = [createSource()]): Filterable<TResult> {
    return getFilterables(mountEnhancedData(sources)).value[0]
  }

  function mountFirstDisplayData(sources: TSource[] = [createSource()]): Display<TResult> {
    const result = mountEnhancedData(sources)

    return result.getDisplayData(getFilterables(result).value[0]) as Display<TResult>
  }

  return { mountEnhancedData, mountFirstFilterable, mountFirstDisplayData }
}
