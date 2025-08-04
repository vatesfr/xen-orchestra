import type { NameConfig } from '@/composables/xo-collection-state/types.ts'

export function toNameConfig(baseName: string | NameConfig): NameConfig {
  if (typeof baseName === 'object') {
    return baseName
  }

  const capitalizedBaseName = baseName.charAt(0).toUpperCase() + baseName.slice(1)

  return {
    records: `${baseName}s`,
    getById: `get${capitalizedBaseName}ById`,
    getByIds: `get${capitalizedBaseName}sByIds`,
    useGetById: `useGet${capitalizedBaseName}ById`,
    useGetByIds: `useGet${capitalizedBaseName}sByIds`,
    hasById: `has${capitalizedBaseName}ById`,
    useHasById: `useHas${capitalizedBaseName}ById`,
    isReady: `is${capitalizedBaseName}CollectionReady`,
    hasError: `has${capitalizedBaseName}CollectionError`,
    lastError: `last${capitalizedBaseName}CollectionError`,
  }
}
