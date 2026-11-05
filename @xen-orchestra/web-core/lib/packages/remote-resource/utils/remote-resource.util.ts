import type { ResourceContext } from '@core/packages/remote-resource/types.ts'
import { until } from '@vueuse/core'
import type { EffectScope } from 'vue'

export async function waitForCollection<TCollection extends { $context: ResourceContext<any[]> }>(
  collection: TCollection,
  { timeout }: { timeout?: number } = {}
): Promise<TCollection> {
  const { isReady, hasError, lastError } = collection.$context
  await until(() => isReady.value || hasError.value).toBe(true, {
    timeout,
    throwOnTimeout: timeout !== undefined,
  })

  if (hasError.value) {
    throw lastError.value
  }

  return collection
}

const cacheByScope = new WeakMap<EffectScope, Map<(context: any) => unknown, unknown>>()
export function useOncePerScope<TContext extends { scope: EffectScope }, TResult>(
  composable: (context: TContext) => TResult,
  context: TContext
): TResult {
  let cache = cacheByScope.get(context.scope)
  if (cache === undefined) {
    cache = new Map()
    cacheByScope.set(context.scope, cache)
  }

  if (!cache.has(composable)) {
    cache.set(composable, composable(context))
  }

  return cache.get(composable) as TResult
}
