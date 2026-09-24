import type { VoidFunction } from '@core/types/utility.type.ts'

/**
 * Reloads every Docker resource of a tab: `forceReload()` only reloads its own
 * resource.
 */
export function useDockerRefresh(reloads: (VoidFunction | undefined)[]) {
  function refresh() {
    reloads.forEach(reload => reload?.())
  }

  return { refresh }
}
