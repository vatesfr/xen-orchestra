import type { NameConfig } from '@/composables/xo-collection-state/types.ts'

export function toNameConfig(baseName: string | [string, string] | NameConfig): NameConfig {
  if (typeof baseName === 'object' && !Array.isArray(baseName)) {
    return baseName
  }

  const [singularName, pluralName] = Array.isArray(baseName) ? baseName : [baseName, `${baseName}s`]

  const capitalizedSingularName = singularName.charAt(0).toUpperCase() + singularName.slice(1)
  const capitalizedPluralName = pluralName.charAt(0).toUpperCase() + pluralName.slice(1)

  return {
    records: `${pluralName}`,
    getById: `get${capitalizedSingularName}ById`,
    getByIds: `get${capitalizedPluralName}ByIds`,
    useGetById: `useGet${capitalizedSingularName}ById`,
    useGetByIds: `useGet${capitalizedPluralName}ByIds`,
    hasById: `has${capitalizedSingularName}ById`,
    useHasById: `useHas${capitalizedSingularName}ById`,
    isReady: `is${capitalizedSingularName}CollectionReady`,
    hasError: `has${capitalizedSingularName}CollectionError`,
    lastError: `last${capitalizedSingularName}CollectionError`,
  }
}
